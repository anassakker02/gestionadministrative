#!/usr/bin/env node
/**
 * Scanner de sécurité automatisé — DAST-like
 * Simule les tests manuels effectués lors de l'audit AppSec
 * Usage : node scripts/security_scan.js [BASE_URL]
 *
 * Tests couverts :
 *  ✅ Auth sans token → 401
 *  ✅ Rate limiting → 429 après N requêtes
 *  ✅ Injection SQL dans les params → 403 (WAF)
 *  ✅ XSS dans le body → 403 (WAF)
 *  ✅ Path traversal dans l'URL → 403 (WAF)
 *  ✅ Agent suspect → 403 (WAF)
 *  ✅ Privilege escalation → rôle forcé à 'etudiant'
 *  ✅ Header X-Powered-By absent
 *  ✅ CORS non autorisé → rejeté
 *  ✅ Input oversized → 413
 */

const http  = require("http");
const https = require("https");

const BASE_URL = process.argv[2] || "http://127.0.0.1:5001/frais-gestionscolaire/us-central1/api";

// ── Couleurs terminal ─────────────────────────────────────────────────────────
const RED    = "\x1b[31m";
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE   = "\x1b[34m";
const CYAN   = "\x1b[36m";
const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";

// ── Résultats ─────────────────────────────────────────────────────────────────
const results = [];

function pass(id, name, detail = "") {
  results.push({ id, name, status: "PASS", detail });
  console.log(`  ${GREEN}✅ PASS${RESET}  [${id}] ${name}${detail ? " — " + detail : ""}`);
}

function fail(id, name, detail = "") {
  results.push({ id, name, status: "FAIL", detail });
  console.log(`  ${RED}❌ FAIL${RESET}  [${id}] ${name}${detail ? " — " + detail : ""}`);
}

function warn(id, name, detail = "") {
  results.push({ id, name, status: "WARN", detail });
  console.log(`  ${YELLOW}⚠️  WARN${RESET}  [${id}] ${name}${detail ? " — " + detail : ""}`);
}

function info(msg) {
  console.log(`  ${CYAN}ℹ️  ${msg}${RESET}`);
}

// ── HTTP request helper ────────────────────────────────────────────────────────
function request(url, options = {}, body = null) {
  return new Promise((resolve) => {
    const parsed = new URL(url);
    const lib = parsed.protocol === "https:" ? https : http;

    const reqOptions = {
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === "https:" ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method:   options.method || "GET",
      headers: {
        "Content-Type":  "application/json",
        "User-Agent":    options.userAgent || "SecurityScanner/1.0 (PFE-Audit)",
        ...(options.headers || {}),
      },
      timeout: 8000,
    };

    if (body) {
      const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
      reqOptions.headers["Content-Length"] = Buffer.byteLength(bodyStr);
    }

    const req = lib.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) {}
        resolve({
          status:  res.statusCode,
          headers: res.headers,
          body:    json || data,
          raw:     data,
        });
      });
    });

    req.on("error", (err) => resolve({ status: 0, error: err.message, headers: {}, body: null }));
    req.on("timeout", () => { req.destroy(); resolve({ status: 0, error: "timeout", headers: {}, body: null }); });

    if (body) {
      const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
      req.write(bodyStr);
    }
    req.end();
  });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ═══════════════════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════════════════

async function testHealthEndpoint() {
  console.log(`\n${BOLD}${BLUE}── T01 : Santé de l'API ────────────────────────────────────────${RESET}`);
  const res = await request(`${BASE_URL}/v1/health`);
  if (res.status === 200 && res.body?.status === true) {
    pass("T01", "API accessible et opérationnelle", `uptime=${res.body.uptime}s`);
  } else if (res.status === 0) {
    fail("T01", "API inaccessible", res.error || "connexion refusée");
    console.log(`  ${YELLOW}⚠️  Vérifiez que l'émulateur Firebase est démarré : firebase emulators:start${RESET}`);
    return false;
  } else {
    warn("T01", "Réponse inattendue", `HTTP ${res.status}`);
  }
  return true;
}

async function testSecurityHeaders() {
  console.log(`\n${BOLD}${BLUE}── T02 : Headers de sécurité HTTP ──────────────────────────────${RESET}`);
  const res = await request(`${BASE_URL}/v1/health`);
  const h   = res.headers;

  // X-Powered-By doit être absent
  if (!h["x-powered-by"]) {
    pass("T02a", "X-Powered-By absent");
  } else {
    fail("T02a", "X-Powered-By exposé", h["x-powered-by"]);
  }

  // HSTS
  if (h["strict-transport-security"]) {
    pass("T02b", "HSTS présent", h["strict-transport-security"]);
  } else {
    warn("T02b", "HSTS absent (normal sur HTTP local)", "présent en production Firebase");
  }

  // X-Frame-Options ou CSP frame-ancestors
  if (h["x-frame-options"] || (h["content-security-policy"] || "").includes("frame")) {
    pass("T02c", "Protection clickjacking active");
  } else {
    warn("T02c", "X-Frame-Options absent", "vérifier Helmet CSP");
  }

  // X-Content-Type-Options
  if (h["x-content-type-options"] === "nosniff") {
    pass("T02d", "X-Content-Type-Options: nosniff");
  } else {
    warn("T02d", "X-Content-Type-Options manquant");
  }
}

async function testAuthRequired() {
  console.log(`\n${BOLD}${BLUE}── T03 : Protection des endpoints (auth requise) ───────────────${RESET}`);
  const endpoints = [
    { path: "/v1/etudiants",         method: "GET"  },
    { path: "/v1/paiements",         method: "GET"  },
    { path: "/v1/factures",          method: "GET"  },
    { path: "/v1/monitoring/security", method: "GET" },
    { path: "/v1/users",             method: "GET"  },
  ];

  for (const ep of endpoints) {
    const res = await request(`${BASE_URL}${ep.path}`, { method: ep.method });
    if (res.status === 401 || res.status === 403) {
      pass("T03", `${ep.method} ${ep.path} → ${res.status} (protégé)`);
    } else if (res.status === 0) {
      warn("T03", `${ep.method} ${ep.path}`, "non joignable");
    } else {
      fail("T03", `${ep.method} ${ep.path} → ${res.status}`, "endpoint non protégé !");
    }
  }
}

async function testRateLimiting() {
  console.log(`\n${BOLD}${BLUE}── T04 : Rate Limiting ──────────────────────────────────────────${RESET}`);
  info("Envoi de 12 requêtes rapides sur /v1/auth/login...");

  let got429 = false;
  for (let i = 0; i < 12; i++) {
    const res = await request(`${BASE_URL}/v1/auth/login`, { method: "POST" }, {
      email:    "test_ratelimit@scan.local",
      password: "WrongPassword123!",
    });
    if (res.status === 429) {
      pass("T04", `Rate limiting déclenché à la tentative ${i + 1}`, "HTTP 429");
      got429 = true;
      break;
    }
    await sleep(100);
  }
  if (!got429) {
    warn("T04", "Rate limiting non déclenché sur 12 tentatives", "vérifier la config limiter");
  }
}

async function testWafSqlInjection() {
  console.log(`\n${BOLD}${BLUE}── T05 : WAF — Injection SQL ────────────────────────────────────${RESET}`);
  const payloads = [
    "/v1/etudiants?id=' OR '1'='1",
    "/v1/etudiants?nom=admin' UNION SELECT * FROM users--",
    "/v1/etudiants?filter=1; DROP TABLE etudiants;--",
  ];

  for (const path of payloads) {
    const res = await request(`${BASE_URL}${path}`);
    if (res.status === 403) {
      pass("T05", `SQLi bloqué`, path.slice(0, 60) + "...");
    } else if (res.status === 401) {
      warn("T05", `Auth avant WAF (acceptable)`, path.slice(0, 60));
    } else if (res.status === 0) {
      warn("T05", "Non joignable", path.slice(0, 40));
    } else {
      fail("T05", `SQLi non bloqué → HTTP ${res.status}`, path.slice(0, 60));
    }
  }
}

async function testWafXss() {
  console.log(`\n${BOLD}${BLUE}── T06 : WAF — XSS ─────────────────────────────────────────────${RESET}`);
  const payloads = [
    { nom: "<script>alert('xss')</script>", email: "test@test.com", password: "Test1234!" },
    { nom: "<img src=x onerror=alert(1)>",  email: "test@test.com", password: "Test1234!" },
    { nom: "javascript:alert(1)",            email: "test@test.com", password: "Test1234!" },
  ];

  for (const body of payloads) {
    const res = await request(`${BASE_URL}/v1/auth/register`, { method: "POST" }, body);
    if (res.status === 403) {
      pass("T06", `XSS bloqué par le WAF`, body.nom.slice(0, 40));
    } else if (res.status === 400 || res.status === 422) {
      pass("T06", `XSS rejeté par validation`, body.nom.slice(0, 40));
    } else if (res.status === 0) {
      warn("T06", "Non joignable", body.nom.slice(0, 40));
    } else {
      fail("T06", `XSS non bloqué → HTTP ${res.status}`, body.nom.slice(0, 40));
    }
  }
}

async function testWafPathTraversal() {
  console.log(`\n${BOLD}${BLUE}── T07 : WAF — Path Traversal ───────────────────────────────────${RESET}`);
  const paths = [
    "/v1/../../../etc/passwd",
    "/v1/etudiants/../../config/firebase",
    "/v1/%2e%2e/%2e%2e/etc/passwd",
  ];

  for (const path of paths) {
    const res = await request(`${BASE_URL}${path}`);
    if (res.status === 403) {
      pass("T07", `Path traversal bloqué`, path.slice(0, 50));
    } else if (res.status === 404 || res.status === 401) {
      pass("T07", `Path traversal → ${res.status} (non exploitable)`, path.slice(0, 50));
    } else if (res.status === 0) {
      warn("T07", "Non joignable", path.slice(0, 40));
    } else {
      fail("T07", `Path traversal non bloqué → HTTP ${res.status}`, path.slice(0, 50));
    }
  }
}

async function testWafSuspiciousAgent() {
  console.log(`\n${BOLD}${BLUE}── T08 : WAF — User-Agent suspect ───────────────────────────────${RESET}`);
  const agents = ["sqlmap/1.7.8", "Nikto/2.1.6", "dirbuster/1.0", "masscan/1.3"];

  for (const ua of agents) {
    const res = await request(`${BASE_URL}/v1/health`, { userAgent: ua });
    if (res.status === 403) {
      pass("T08", `Agent suspect bloqué`, ua);
    } else if (res.status === 0) {
      warn("T08", "Non joignable", ua);
    } else {
      fail("T08", `Agent suspect non bloqué → HTTP ${res.status}`, ua);
    }
  }
}

async function testInputSizeLimit() {
  console.log(`\n${BOLD}${BLUE}── T09 : Limite de taille des requêtes ──────────────────────────${RESET}`);
  const bigPayload = { nom: "A".repeat(15000), email: "x@x.com", password: "Test1234!" };
  const res = await request(`${BASE_URL}/v1/auth/register`, { method: "POST" }, bigPayload);
  if (res.status === 413) {
    pass("T09", "Payload > 10kb rejeté → HTTP 413");
  } else if (res.status === 403) {
    pass("T09", "Payload volumineux bloqué → HTTP 403 (WAF)");
  } else if (res.status === 0) {
    warn("T09", "Non joignable");
  } else {
    warn("T09", `HTTP ${res.status} reçu`, "vérifier la limite express.json");
  }
}

async function testPrivilegeEscalation() {
  console.log(`\n${BOLD}${BLUE}── T10 : Privilege Escalation (role manipulation) ───────────────${RESET}`);
  info("Tentative d'inscription avec role=admin...");
  const res = await request(`${BASE_URL}/v1/auth/register`, { method: "POST" }, {
    email:    `pentest_${Date.now()}@scan.local`,
    password: "SecureP@ss1234!",
    nom:      "Pentest",
    prenom:   "Scanner",
    role:     "admin",
  });

  if (res.status === 201 || res.status === 200) {
    // Inscription réussie : vérifier le rôle attribué
    const role = res.body?.user?.role || res.body?.role;
    if (role && role !== "admin") {
      pass("T10", "Privilege escalation bloqué", `rôle attribué = '${role}' (pas admin)`);
    } else if (role === "admin") {
      fail("T10", "PRIVILEGE ESCALATION RÉUSSIE !", "rôle admin attribué sans autorisation !");
    } else {
      warn("T10", "Impossible de vérifier le rôle dans la réponse", `HTTP ${res.status}`);
    }
  } else if (res.status === 403 || res.status === 400) {
    pass("T10", "Inscription avec role=admin rejetée", `HTTP ${res.status}`);
  } else if (res.status === 0) {
    warn("T10", "Non joignable");
  } else {
    warn("T10", `HTTP ${res.status}`, JSON.stringify(res.body || "").slice(0, 100));
  }
}

async function testMonitoringAdminOnly() {
  console.log(`\n${BOLD}${BLUE}── T11 : Monitoring réservé aux admins ──────────────────────────${RESET}`);

  // Sans token
  const r1 = await request(`${BASE_URL}/v1/monitoring/security`);
  if (r1.status === 401) {
    pass("T11a", "Sans token → 401");
  } else {
    fail("T11a", `Sans token → ${r1.status}`, "devrait être 401");
  }

  // Avec faux token
  const r2 = await request(`${BASE_URL}/v1/monitoring/security`, {
    headers: { Authorization: "Bearer faketoken123" },
  });
  if (r2.status === 401) {
    pass("T11b", "Token invalide → 401");
  } else {
    fail("T11b", `Token invalide → ${r2.status}`);
  }
}

async function testCors() {
  console.log(`\n${BOLD}${BLUE}── T12 : CORS — Origine non autorisée ───────────────────────────${RESET}`);
  const res = await request(`${BASE_URL}/v1/health`, {
    headers: { Origin: "https://evil-attacker.com" },
  });
  const acao = res.headers["access-control-allow-origin"] || "";
  if (acao === "https://evil-attacker.com" || acao === "*") {
    fail("T12", "CORS autorise les origines non whitelistées", acao);
  } else {
    pass("T12", "CORS refuse l'origine non autorisée", acao || "header absent");
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RAPPORT FINAL
// ═══════════════════════════════════════════════════════════════════════════════

function printReport() {
  const passed  = results.filter(r => r.status === "PASS").length;
  const failed  = results.filter(r => r.status === "FAIL").length;
  const warned  = results.filter(r => r.status === "WARN").length;
  const total   = results.length;
  const score   = Math.round((passed / total) * 100);

  console.log(`\n${BOLD}${"═".repeat(65)}${RESET}`);
  console.log(`${BOLD}  RAPPORT DU SCAN DE SÉCURITÉ — DAST-like${RESET}`);
  console.log(`${"═".repeat(65)}`);
  console.log(`  Cible       : ${BASE_URL}`);
  console.log(`  Date        : ${new Date().toLocaleString("fr-FR")}`);
  console.log(`  Tests       : ${total} exécutés`);
  console.log(`  ${GREEN}✅ Réussis  : ${passed}${RESET}`);
  console.log(`  ${RED}❌ Échoués  : ${failed}${RESET}`);
  console.log(`  ${YELLOW}⚠️  Warnings : ${warned}${RESET}`);
  console.log(`  Score       : ${score >= 80 ? GREEN : score >= 60 ? YELLOW : RED}${score}/100${RESET}`);
  console.log(`${"═".repeat(65)}`);

  if (failed > 0) {
    console.log(`\n${RED}${BOLD}  ⚠️  VULNÉRABILITÉS DÉTECTÉES :${RESET}`);
    results.filter(r => r.status === "FAIL").forEach(r => {
      console.log(`  ${RED}❌ [${r.id}] ${r.name}${RESET}`);
      if (r.detail) console.log(`      ${r.detail}`);
    });
  } else {
    console.log(`\n${GREEN}${BOLD}  ✅ Aucune vulnérabilité critique détectée${RESET}`);
  }

  console.log(`\n${CYAN}  Référentiel : OWASP Top 10 (2021) — Tests : F-01 à F-08 couverts${RESET}`);
  console.log(`  Rapport complet dans RAPPORT_SECURITE_PFE.docx\n`);

  return { score, passed, failed, warned, total };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log(`\n${BOLD}${"═".repeat(65)}${RESET}`);
  console.log(`${BOLD}  SCANNER DE SÉCURITÉ APPLICATIVE — DAST-like${RESET}`);
  console.log(`${BOLD}  PFE Bachelor — Cybersécurité / Cyberdéfense${RESET}`);
  console.log(`${"═".repeat(65)}`);
  console.log(`  Cible : ${BASE_URL}`);
  console.log(`  Référentiel : OWASP Top 10 (2021)\n`);

  const apiUp = await testHealthEndpoint();

  if (!apiUp) {
    console.log(`\n${YELLOW}  Mode hors-ligne : seuls les tests de structure sont disponibles.${RESET}`);
    console.log(`  Démarrez l'émulateur : ${CYAN}firebase emulators:start${RESET}\n`);
    return;
  }

  await testSecurityHeaders();
  await testAuthRequired();
  await testRateLimiting();
  await testWafSqlInjection();
  await testWafXss();
  await testWafPathTraversal();
  await testWafSuspiciousAgent();
  await testInputSizeLimit();
  await testPrivilegeEscalation();
  await testMonitoringAdminOnly();
  await testCors();

  printReport();
}

main().catch(err => {
  console.error(`\n${RED}Erreur fatale du scanner :${RESET}`, err.message);
  process.exit(1);
});
