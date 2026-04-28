/**
 * WAF — Web Application Firewall applicatif
 * Détecte et bloque : SQLi · XSS · Path Traversal · Command Injection · Agents suspects
 * Journalise chaque blocage dans auditLogs Firestore (action: "WAF_BLOCK")
 */

// ── Patterns d'attaques ───────────────────────────────────────────────────────

const SQL_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE|TRUNCATE|REPLACE)\b)/i,
  /(--|;--|\/\*|\*\/|xp_|sp_exec)/,
  /('\s*(OR|AND)\s*'?\d+'\s*=\s*'?\d+)/i,
  /(SLEEP\s*\(\d+\)|BENCHMARK\s*\()/i,
  /(INFORMATION_SCHEMA|sysobjects|syscolumns)/i,
];

const XSS_PATTERNS = [
  /<\s*script\b[^>]*>[\s\S]*?<\/\s*script\s*>/gi,
  /<\s*script\b[^>]*\/?\s*>/gi,
  /javascript\s*:/i,
  /on(load|error|click|mouse|focus|blur|change|submit|key|pointer|drag)\s*=/i,
  /<\s*iframe\b/i,
  /<\s*object\b/i,
  /<\s*embed\b/i,
  /document\.(cookie|write|location)/i,
  /eval\s*\(|setTimeout\s*\(|setInterval\s*\(/i,
  /expression\s*\(/i,
  /vbscript\s*:/i,
];

const PATH_TRAVERSAL_PATTERNS = [
  /\.\.[\/\\]/,
  /%2e%2e[%2f%5c]/i,
  /%252e%252e/i,
  /\.\.[%c0%af%c1%9c]/i,
];

const CMD_INJECTION_PATTERNS = [
  /[;&|`]\s*(cat|ls|pwd|whoami|id|uname|wget|curl|bash|sh|cmd|powershell|nc|netcat|python|perl|php)\b/i,
  /\$\(\s*(cat|ls|id|whoami)/i,
  /`\s*(cat|ls|id|whoami)/i,
];

const SUSPICIOUS_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /masscan/i,
  /nmap/i,
  /zgrab/i,
  /dirbuster/i,
  /gobuster/i,
  /wfuzz/i,
  /hydra/i,
  /medusa/i,
  /havij/i,
  /acunetix/i,
  /appscan/i,
  /nessus/i,
  /openvas/i,
  /w3af/i,
  /libwww-perl/i,
];

// ── Helper : scanner une valeur string ───────────────────────────────────────
function scanString(value) {
  if (typeof value !== "string" || value.length === 0) return null;

  // Décode l'URL pour attraper les encodages
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch (_) { /* keep raw */ }

  for (const p of SQL_PATTERNS) {
    if (p.test(decoded)) return { type: "SQL_INJECTION", pattern: p.toString() };
  }
  for (const p of XSS_PATTERNS) {
    if (p.test(decoded)) return { type: "XSS", pattern: p.toString() };
  }
  for (const p of PATH_TRAVERSAL_PATTERNS) {
    if (p.test(decoded)) return { type: "PATH_TRAVERSAL", pattern: p.toString() };
  }
  for (const p of CMD_INJECTION_PATTERNS) {
    if (p.test(decoded)) return { type: "CMD_INJECTION", pattern: p.toString() };
  }
  return null;
}

// ── Helper : scanner récursivement un objet ───────────────────────────────────
function scanObject(obj, depth = 0, skipKeys = []) {
  if (!obj || typeof obj !== "object" || depth > 6) return null;

  for (const [key, value] of Object.entries(obj)) {
    if (skipKeys.includes(key)) continue;

    const keyHit = scanString(key);
    if (keyHit) return keyHit;

    if (typeof value === "string") {
      const hit = scanString(value);
      if (hit) return hit;
    } else if (typeof value === "object" && value !== null) {
      const hit = scanObject(value, depth + 1, skipKeys);
      if (hit) return hit;
    }
  }
  return null;
}

// ── Log WAF Block dans auditLogs ─────────────────────────────────────────────
async function logWafBlock(req, reason, pattern) {
  try {
    const db = require("../config/firebase");
    await db.collection("auditLogs").add({
      userId: req.user?.userId || null,
      action: "WAF_BLOCK",
      timestamp: new Date(),
      metadata: {
        email:     req.user?.email   || null,
        ip:        req.ip            || req.connection?.remoteAddress || null,
        path:      req.originalUrl   || req.path,
        method:    req.method,
        reason,
        pattern:   String(pattern).slice(0, 200),
        userAgent: (req.headers["user-agent"] || "").slice(0, 200),
      },
    });
  } catch (err) {
    console.error("[WAF] log error:", err.message);
  }
}

// ── Middleware principal ──────────────────────────────────────────────────────
const wafMiddleware = async (req, res, next) => {
  // 1. User-Agent suspect
  const ua = req.headers["user-agent"] || "";
  for (const p of SUSPICIOUS_AGENTS) {
    if (p.test(ua)) {
      await logWafBlock(req, "SUSPICIOUS_AGENT", p);
      return res.status(403).json({ error: "Accès refusé par le pare-feu applicatif." });
    }
  }

  // 2. URL / Path
  const urlHit = scanString(req.originalUrl || req.url);
  if (urlHit) {
    await logWafBlock(req, urlHit.type, urlHit.pattern);
    return res.status(403).json({ error: "Requête bloquée : contenu potentiellement malveillant." });
  }

  // 3. Query params
  if (req.query && typeof req.query === "object") {
    const qHit = scanObject(req.query);
    if (qHit) {
      await logWafBlock(req, qHit.type, qHit.pattern);
      return res.status(403).json({ error: "Requête bloquée : paramètre invalide." });
    }
  }

  // 4. Body (skip : password, hash — évite les faux positifs)
  if (req.body && typeof req.body === "object") {
    const bHit = scanObject(req.body, 0, ["password", "passwordHash", "currentPassword", "newPassword", "confirmPassword"]);
    if (bHit) {
      await logWafBlock(req, bHit.type, bHit.pattern);
      return res.status(403).json({ error: "Requête bloquée : données invalides." });
    }
  }

  next();
};

module.exports = { wafMiddleware };
