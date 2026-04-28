require("dotenv").config();
process.env.FUNCTIONS_EMULATOR = "true";
const db = require("../src/config/firebase");

(async () => {
  const now = new Date();

  const events = [
    // Échecs connexion — dans les 30 dernières minutes
    { action: "USER_LOGIN_FAILURE", timestamp: new Date(now - 5  * 60000), details: { ip: "127.0.0.1",   email: "admin@gmail.com",  reason: "Mot de passe incorrect" }},
    { action: "USER_LOGIN_FAILURE", timestamp: new Date(now - 10 * 60000), details: { ip: "127.0.0.1",   email: "admin@gmail.com",  reason: "Mot de passe incorrect" }},
    { action: "USER_LOGIN_FAILURE", timestamp: new Date(now - 15 * 60000), details: { ip: "127.0.0.1",   email: "admin@gmail.com",  reason: "Mot de passe incorrect" }},
    { action: "USER_LOGIN_FAILURE", timestamp: new Date(now - 20 * 60000), details: { ip: "127.0.0.1",   email: "admin@gmail.com",  reason: "Mot de passe incorrect" }},
    { action: "USER_LOGIN_FAILURE", timestamp: new Date(now - 25 * 60000), details: { ip: "192.168.1.1", email: "test@test.com",    reason: "Utilisateur inexistant" }},

    // Blocages brute force — dans les 30 dernières minutes
    { action: "AUTH_LOCKOUT", timestamp: new Date(now - 8  * 60000), details: { ip: "127.0.0.1",   email: "admin@gmail.com",  reason: "5 tentatives echouees — blocage 5 min" }},
    { action: "AUTH_LOCKOUT", timestamp: new Date(now - 18 * 60000), details: { ip: "192.168.1.1", email: "test@test.com",    reason: "5 tentatives echouees — blocage 5 min" }},
    { action: "AUTH_LOCKOUT", timestamp: new Date(now - 28 * 60000), details: { ip: "10.0.0.1",    email: "bot@attack.com",   reason: "5 tentatives echouees — blocage 5 min" }},
  ];

  console.log("Insertion de", events.length, "events dans Firestore...");

  const batch = db.batch();
  events.forEach(e => batch.set(db.collection("auditLogs").doc(), e));
  await batch.commit();

  console.log("");
  console.log("✅ DONE — Events insérés avec succès !");
  console.log("─────────────────────────────────────");
  console.log("   Dernière heure — Échecs connexion : 5");
  console.log("   Dernière heure — Blocages         : 3");
  console.log("─────────────────────────────────────");
  console.log("→ Clique sur Rafraîchir dans le dashboard");
  process.exit(0);
})();