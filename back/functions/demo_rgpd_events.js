/**
 * demo_rgpd_events.js
 * Insère des événements RGPD (DATA_EXPORT + DATA_ANONYMIZE) directement
 * dans Firestore auditLogs pour la démonstration du dashboard monitoring.
 *
 * Usage : node demo_rgpd_events.js
 * (depuis le dossier back/functions avec .env chargé)
 */

require("dotenv").config({ path: ".env" });

// Force le mode emulator pour utiliser admin.json (connexion Firestore réelle)
process.env.FUNCTIONS_EMULATOR = "true";

const db = require("./src/config/firebase");

const events = [
  {
    action: "DATA_EXPORT",
    timestamp: new Date(),
    metadata: {
      email: "etudiant1@school.fr",
      role: "etudiant",
      path: "/v1/users/etudiant1/export",
      reason: "Art.15 — Droit d'accès — export RGPD demandé",
      ip: "127.0.0.1",
    },
  },
  {
    action: "DATA_EXPORT",
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    metadata: {
      email: "parent1@school.fr",
      role: "parent",
      path: "/v1/users/parent1/export",
      reason: "Art.15 — Droit d'accès — export RGPD demandé",
      ip: "127.0.0.1",
    },
  },
  {
    action: "DATA_EXPORT",
    timestamp: new Date(Date.now() - 12 * 60 * 1000),
    metadata: {
      email: "etudiant2@school.fr",
      role: "etudiant",
      path: "/v1/users/etudiant2/export",
      reason: "Art.15 — Droit d'accès — export RGPD demandé",
      ip: "127.0.0.1",
    },
  },
  {
    action: "DATA_ANONYMIZE",
    timestamp: new Date(Date.now() - 20 * 60 * 1000),
    metadata: {
      email: "admin@school.fr",
      role: "admin",
      path: "/v1/users/ancietudiant/data",
      reason: "Art.17 — Droit à l'oubli — anonymisation demandée",
      ip: "127.0.0.1",
    },
  },
  {
    action: "DATA_ANONYMIZE",
    timestamp: new Date(Date.now() - 35 * 60 * 1000),
    metadata: {
      email: "admin@school.fr",
      role: "admin",
      path: "/v1/users/ancienparent/data",
      reason: "Art.17 — Droit à l'oubli — anonymisation demandée",
      ip: "127.0.0.1",
    },
  },
];

async function main() {
  try {
    const batch = db.batch();
    for (const event of events) {
      const ref = db.collection("auditLogs").doc();
      batch.set(ref, event);
    }
    await batch.commit();
    console.log(`✅ ${events.length} événements RGPD insérés dans auditLogs`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Erreur Firestore :", err.message);
    process.exit(1);
  }
}

main();