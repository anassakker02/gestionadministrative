const admin = require("firebase-admin");

// Detect if running inside Firebase emulator
const isEmulator = !!(
  process.env.FUNCTIONS_EMULATOR ||
  process.env.FIREBASE_EMULATOR_HUB
);

if (!admin.apps.length) {
  if (isEmulator) {
    // In emulator: force connection to REAL Firestore (not emulator Firestore)
    // by deleting the emulator host env vars before initializing
    delete process.env.FIRESTORE_EMULATOR_HOST;
    delete process.env.FIREBASE_FIRESTORE_EMULATOR_HOST;

    const serviceAccount = require("./admin.json");
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: "gestionadminastration",
    });
    console.log("🔥 Firebase Admin initialized (emulator mode → real Firestore)");
  } else {
    // In production (deployed Cloud Functions): use default credentials
    admin.initializeApp();
    console.log("🔥 Firebase Admin initialized (production mode)");
  }
}

// Export Firestore instance
const db = admin.firestore();

// Ignore undefined properties when writing documents to Firestore
try {
  db.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  // settings() may throw if already set; fail silently
  console.warn("Could not set Firestore settings:", e && e.message);
}

module.exports = db;
