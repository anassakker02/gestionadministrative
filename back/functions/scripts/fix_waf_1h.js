require("dotenv").config();
process.env.FUNCTIONS_EMULATOR = "true";
const db = require("../src/config/firebase");

(async () => {
  const now = new Date();

  const events = [
    // WAF attaques bloquées — dans les 30 dernières minutes
    { action: "WAF_BLOCK", timestamp: new Date(now - 3  * 60000), metadata: { ip: "127.0.0.1",   path: "/v1/etudiants?id=1 OR 1=1--",                        reason: "SQL_INJECTION",   type: "SQL_INJECTION",   userAgent: "sqlmap/1.7" }},
    { action: "WAF_BLOCK", timestamp: new Date(now - 7  * 60000), metadata: { ip: "127.0.0.1",   path: "/v1/etudiants?nom=<script>alert(1)</script>",         reason: "XSS",             type: "XSS",             userAgent: "Mozilla/5.0" }},
    { action: "WAF_BLOCK", timestamp: new Date(now - 12 * 60000), metadata: { ip: "192.168.1.1", path: "/v1/etudiants?file=../../etc/passwd",                 reason: "PATH_TRAVERSAL",  type: "PATH_TRAVERSAL",  userAgent: "curl/7.68" }},
    { action: "WAF_BLOCK", timestamp: new Date(now - 18 * 60000), metadata: { ip: "127.0.0.1",   path: "/v1/etudiants?id=1 UNION SELECT *--",                 reason: "SQL_INJECTION",   type: "SQL_INJECTION",   userAgent: "sqlmap/1.7" }},
    { action: "WAF_BLOCK", timestamp: new Date(now - 22 * 60000), metadata: { ip: "10.0.0.1",    path: "/v1/etudiants?nom=<img onerror=alert(1)>",            reason: "XSS",             type: "XSS",             userAgent: "Mozilla/5.0" }},
    { action: "WAF_BLOCK", timestamp: new Date(now - 27 * 60000), metadata: { ip: "192.168.1.2", path: "/v1/classes?file=../../../etc/shadow",                reason: "PATH_TRAVERSAL",  type: "PATH_TRAVERSAL",  userAgent: "nikto/2.1" }},
    { action: "WAF_BLOCK", timestamp: new Date(now - 32 * 60000), metadata: { ip: "10.0.0.5",    path: "/v1/users",                                           reason: "SUSPICIOUS_AGENT",type: "SUSPICIOUS_AGENT",userAgent: "nikto/2.1.6" }},
    { action: "WAF_BLOCK", timestamp: new Date(now - 40 * 60000), metadata: { ip: "127.0.0.1",   path: "/v1/paiements?cmd=ls;cat /etc/passwd",                reason: "CMD_INJECTION",   type: "CMD_INJECTION",   userAgent: "curl/7.68" }},
    { action: "WAF_BLOCK", timestamp: new Date(now - 48 * 60000), metadata: { ip: "127.0.0.1",   path: "/v1/etudiants?id=1 AND SLEEP(5)--",                  reason: "SQL_INJECTION",   type: "SQL_INJECTION",   userAgent: "sqlmap/1.7" }},
    { action: "WAF_BLOCK", timestamp: new Date(now - 55 * 60000), metadata: { ip: "192.168.1.3", path: "/v1/etudiants?nom=%3Cscript%3Ealert%281%29%3C%2Fscript%3E", reason: "XSS",    type: "XSS",             userAgent: "Mozilla/5.0" }},
  ];

  console.log("Insertion de", events.length, "events WAF_BLOCK dans Firestore...");

  const batch = db.batch();
  events.forEach(e => batch.set(db.collection("auditLogs").doc(), e));
  await batch.commit();

  console.log("");
  console.log("✅ DONE — Events insérés avec succès !");
  console.log("─────────────────────────────────────");
  console.log("   WAF — Bloquées (1h) : 10");
  console.log("─────────────────────────────────────");
  console.log("→ Clique sur Rafraîchir dans le dashboard");
  process.exit(0);
})();