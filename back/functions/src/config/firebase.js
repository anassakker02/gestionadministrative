const admin = require("firebase-admin");
const serviceAccount = require("./admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://gestionadminastration-default-rtdb.europe-west1.firebasedatabase.app",
  authDomain: "gestionadminastration.firebaseapp.com",
  projectId: "gestionadminastration",
  storageBucket: "gestionadminastration.appspot.com",
});



// Export Firestore instance
const db = admin.firestore();

// Ignore undefined properties when writing documents to Firestore
// This prevents errors when objects contain undefined fields (e.g. date_naissance undefined)
try {
  db.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  // settings() may throw in some environments; fail silently but log for visibility
  console.warn(
    "Could not set Firestore settings ignoreUndefinedProperties:",
    e && e.message
  );
}

module.exports = db; // Export Firestore instance
