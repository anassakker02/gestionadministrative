require("dotenv").config();
process.env.FUNCTIONS_EMULATOR = "true";
const db = require("../src/config/firebase");

(async () => {
  const now = new Date();

  const events = [
    // Accès refusés RBAC — dans les 30 dernières minutes
    { action: "ACCESS_DENIED", timestamp: new Date(now - 5  * 60000), details: { ip: "127.0.0.1",   path: "/v1/users",      reason: "NO_TOKEN",          role: "none" }},
    { action: "ACCESS_DENIED", timestamp: new Date(now - 10 * 60000), details: { ip: "127.0.0.1",   path: "/v1/monitoring", reason: "INSUFFICIENT_ROLE", role: "comptable" }},
    { action: "ACCESS_DENIED", timestamp: new Date(now - 15 * 60000), details: { ip: "192.168.1.1", path: "/v1/etudiants",  reason: "NO_TOKEN",          role: "none" }},
    { action: "ACCESS_DENIED", timestamp: new Date(now - 20 * 60000), details: { ip: "10.0.0.1",    path: "/v1/classes",    reason: "INSUFFICIENT_ROLE", role: "etudiant" }},
    { action: "ACCESS_DENIED", timestamp: new Date(now - 25 * 60000), details: { ip: "127.0.0.1",   path: "/v1/paiements",  reason: "EXPIRED_TOKEN",     role: "none" }},
  ];

  console.log("Insertion de", events.length, "events ACCESS_DENIED dans Firestore...");

  const batch = db.batch();
  events.forEach(e => batch.set(db.collection("auditLogs").doc(), e));
  await batch.commit();

  console.log("");
  console.log("✅ DONE — Events insérés avec succès !");
  console.log("─────────────────────────────────────");
  console.log("   RBAC — Accès refusés (1h) : 5");
  console.log("─────────────────────────────────────");
  console.log("→ Clique sur Rafraîchir dans le dashboard");
  process.exit(0);
})();