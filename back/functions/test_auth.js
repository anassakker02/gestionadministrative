const admin = require("firebase-admin");
const serviceAccount = require("./src/config/admin.json");

// Force production
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_FIRESTORE_EMULATOR_HOST;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testAuth() {
  console.log("Testing authentication with project:", serviceAccount.project_id);
  try {
    // Attempt to list collections (requires high level permission)
    const collections = await db.listCollections();
    console.log("Successfully listed collections:", collections.map(c => c.id));
    
    // Attempt a simple write
    console.log("Attempting a simple write to '_auth_test'...");
    await db.collection("_auth_test").doc("ping").set({
      timestamp: new Date().toISOString(),
      message: "Authentication successful"
    });
    console.log("✅ Write successful!");
    
  } catch (error) {
    console.error("❌ Authentication Failed!");
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);
    if (error.stack) console.error("Stack Trace:", error.stack);
  }
}

testAuth();
