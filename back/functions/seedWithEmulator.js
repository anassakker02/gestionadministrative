// Script de seed qui utilise l'émulateur Firestore
process.env.FUNCTIONS_EMULATOR = "true";
process.env.NODE_ENV = "development";

const { seedFirestore } = require("./src/utils/seedData");

const runSeeder = async () => {
  try {
    console.log("🚀 Démarrage du seed avec l'émulateur Firestore...");
    await seedFirestore();
    console.log("✅ Seed terminé avec succès !");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors du seed:", error);
    process.exit(1);
  }
};

runSeeder();
