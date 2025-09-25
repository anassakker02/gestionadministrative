const db = require("./src/config/firebase");
const bcrypt = require("bcrypt");

async function fixAllAccounts() {
  try {
    console.log("🔧 Correction de tous les comptes utilisateurs...");
    
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    // Liste de tous les comptes avec leurs informations correctes
    const accounts = [
      {
        id: "admin_user",
        prenom: "Admin",
        nom: "Système",
        email: "admin@gmail.com",
        role: "admin",
        isActive: true,
        status: "active"
      },
      {
        id: "omar_benali_user",
        prenom: "Omar",
        nom: "Benali",
        email: "omar.benali@example.com",
        role: "etudiant",
        isActive: true,
        status: "active"
      },
      {
        id: "fatima_zahra_user",
        prenom: "Fatima",
        nom: "Zahra",
        email: "fatima.zahra@example.com",
        role: "etudiant",
        isActive: true,
        status: "active"
      },
      {
        id: "mohamed_mellouk_user",
        prenom: "Mohamed",
        nom: "Mellouk",
        email: "mohamed.mellouk@example.com",
        role: "etudiant",
        isActive: true,
        status: "active"
      }
    ];

    console.log("📋 Comptes à corriger :");
    accounts.forEach(account => {
      console.log(`   - ${account.email} (${account.role})`);
    });
    console.log();

    // Corriger chaque compte
    for (const account of accounts) {
      try {
        console.log(`🔍 Vérification du compte ${account.email}...`);
        
        // Vérifier si le compte existe
        const userRef = db.collection("users").doc(account.id);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
          console.log(`   ✅ Compte trouvé, mise à jour...`);
          
          // Mettre à jour le compte avec toutes les informations correctes
          await userRef.set({
            ...account,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date()
          }, { merge: true });
          
          console.log(`   ✅ Compte ${account.email} mis à jour avec succès`);
        } else {
          console.log(`   ⚠️  Compte non trouvé, création...`);
          
          // Créer le compte s'il n'existe pas
          await userRef.set({
            ...account,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
          console.log(`   ✅ Compte ${account.email} créé avec succès`);
        }
        
      } catch (error) {
        console.error(`   ❌ Erreur pour ${account.email}:`, error.message);
      }
    }

    console.log("\n🧪 Vérification finale des comptes...");
    
    // Vérifier que tous les comptes sont correctement configurés
    for (const account of accounts) {
      try {
        const userRef = db.collection("users").doc(account.id);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log(`✅ ${account.email}:`);
          console.log(`   - Email: ${userData.email}`);
          console.log(`   - Role: ${userData.role}`);
          console.log(`   - Actif: ${userData.isActive}`);
          console.log(`   - Statut: ${userData.status}`);
          console.log(`   - Mot de passe: ${userData.password ? 'Défini' : 'Manquant'}`);
        } else {
          console.log(`❌ ${account.email}: Compte non trouvé`);
        }
      } catch (error) {
        console.error(`❌ Erreur de vérification pour ${account.email}:`, error.message);
      }
    }

    console.log("\n🎉 Correction terminée !");
    console.log("📝 Informations de connexion :");
    console.log("   - Admin: admin@gmail.com / password123");
    console.log("   - Omar: omar.benali@example.com / password123");
    console.log("   - Fatima: fatima.zahra@example.com / password123");
    console.log("   - Mohamed: mohamed.mellouk@example.com / password123");

  } catch (error) {
    console.error("❌ Erreur lors de la correction des comptes:", error);
    throw error;
  }
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  fixAllAccounts()
    .then(() => {
      console.log("✅ Script terminé avec succès");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Erreur:", error);
      process.exit(1);
    });
}

module.exports = { fixAllAccounts };
