const admin = require("firebase-admin");

// Force production
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_FIRESTORE_EMULATOR_HOST;

try {
  admin.initializeApp();
  console.log("Initialized with default credentials.");
} catch (e) {
  console.log("Failed to initialize with default credentials, trying with admin.json");
  const serviceAccount = require("./src/config/admin.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function test() {
  try {
    const snapshot = await db.collection("users").limit(1).get();
    console.log("✅ Successfully connected to Firestore!");
    console.log("Found", snapshot.size, "documents in 'users'.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Firestore Access Failed!");
    console.error("Code:", error.code);
    console.error("Message:", error.message);
    process.exit(1);
  }
}

test();
