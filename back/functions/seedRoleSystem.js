const { seedFirestore } = require("./src/utils/seedData");
const admin = require("firebase-admin");

// Configuration Firebase pour les seeds
const serviceAccount = {
  // Configuration par défaut pour l'émulateur
  projectId: "demo-project",
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.projectId,
  });
}

const runRoleSystemSeed = async () => {
  try {
    console.log("🚀 Starting role hierarchy system seeding...");
    console.log("📋 This will create:");
    console.log("   - 1 Admin principal");
    console.log("   - 2 Sous-admins");
    console.log("   - 2 Utilisateurs en attente de rôle");
    console.log("   - 2 Enseignants avec entités");
    console.log("   - 1 Parent avec entité");
    console.log("   - 1 Étudiant avec entité");
    console.log("   - Activités d'administration");
    console.log("   - Relations hiérarchiques complètes");
    console.log("");

    await seedFirestore();

    console.log("");
    console.log("✅ Database seeding completed successfully!");
    console.log("");
    console.log("🔑 Comptes de test créés :");
    console.log("📧 Admin: admin@ecole.com / password123");
    console.log("📧 Sous-admin 1: subadmin1@ecole.com / password123");
    console.log("📧 Sous-admin 2: subadmin2@ecole.com / password123");
    console.log("📧 Enseignant 1: enseignant1@ecole.com / password123");
    console.log("📧 Enseignant 2: enseignant2@ecole.com / password123");
    console.log("📧 Parent: parent1@ecole.com / password123");
    console.log("📧 Étudiant: etudiant1@ecole.com / password123");
    console.log("");
    console.log("⏳ Utilisateurs en attente :");
    console.log("📧 pending1@ecole.com / password123");
    console.log("📧 pending2@ecole.com / password123");
    console.log("");
    console.log("💡 Fonctionnalités testables :");
    console.log("   ✓ Connexion avec hiérarchie de rôles");
    console.log("   ✓ Dashboard admin avec statistiques");
    console.log("   ✓ Création de sous-admins (admin seulement)");
    console.log("   ✓ Assignation de rôles (admin/sous-admin)");
    console.log("   ✓ Création automatique d'entités lors assignation");
    console.log("   ✓ Permissions basées sur les rôles");
    console.log("   ✓ Traçabilité des actions d'administration");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error during database seeding:", error);
    console.error(error.stack);
    process.exit(1);
  }
};

// Fonction pour nettoyer la base avant les seeds
const clearDatabase = async () => {
  console.log("🧹 Clearing existing data...");

  const collections = [
    "users",
    "enseignants",
    "parents",
    "etudiants",
    "classes",
    "bourses",
    "tarifs",
    "factures",
    "paiements",
    "fraisPonctuels",
    "relances",
    "admin_activities",
  ];

  const db = admin.firestore();

  for (const collectionName of collections) {
    const collection = db.collection(collectionName);
    const snapshot = await collection.get();

    if (!snapshot.empty) {
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(
        `   ✓ Cleared ${collectionName} (${snapshot.size} documents)`
      );
    }
  }

  console.log("✅ Database cleared successfully");
  console.log("");
};

// Vérification de l'environnement
const checkEnvironment = () => {
  if (process.env.NODE_ENV === "production") {
    console.error(
      "❌ ATTENTION: Ce script ne doit PAS être exécuté en production !"
    );
    process.exit(1);
  }

  console.log("🔧 Environment check passed - running in development mode");
  console.log("");
};

const main = async () => {
  checkEnvironment();

  // Option pour nettoyer avant les seeds
  const shouldClear = process.argv.includes("--clear");

  if (shouldClear) {
    await clearDatabase();
  }

  await runRoleSystemSeed();
};

main();
