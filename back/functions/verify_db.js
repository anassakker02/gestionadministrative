const db = require("./src/config/firebase");

async function verifyConnection() {
  console.log("Checking Firestore connection...");
  console.log("Environment FIRESTORE_EMULATOR_HOST:", process.env.FIRESTORE_EMULATOR_HOST);
  
  try {
    const testDoc = db.collection("_test_connectivity").doc("check");
    const timestamp = new Date().toISOString();
    
    console.log(`Writing test document with timestamp: ${timestamp}...`);
    await testDoc.set({
      connected_at: timestamp,
      source: "local_diagnostic_script"
    });
    
    console.log("Write successful! Reading back...");
    const doc = await testDoc.get();
    
    if (doc.exists) {
      console.log("Read successful! Data:", doc.data());
      console.log("SUCCESS: Connection to Firestore is working.");
      
      if (process.env.FIRESTORE_EMULATOR_HOST) {
        console.log("⚠️ WARNING: You are currently connected to the EMULATOR (" + process.env.FIRESTORE_EMULATOR_HOST + ")");
      } else {
        console.log("✅ CONFIRMED: You are connected to the REAL PRODUCTION database.");
      }
    } else {
      console.error("ERROR: Document was written but not found.");
    }
    
    // Clean up
    await testDoc.delete();
    console.log("Test document deleted.");
    
  } catch (error) {
    console.error("❌ CONNECTION ERROR:", error.message);
    if (error.code === 'unavailable') {
      console.log("Hint: This might be due to incorrect network settings or a firewall.");
    }
  }
}

verifyConnection();
