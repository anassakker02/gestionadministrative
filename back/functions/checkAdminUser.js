const admin = require('firebase-admin');

// Initialiser Firebase Admin pour l'émulateur
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'gestionadminastration'
  });
}

const db = admin.firestore();

async function checkAdminUser() {
  console.log('🔍 Vérification de l\'utilisateur admin...');
  try {
    const adminEmail = "admin@gmail.com";
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', adminEmail).limit(1).get();

    if (snapshot.empty) {
      console.log(`❌ Aucun utilisateur trouvé avec l'email ${adminEmail}.`);
      console.log('📋 Liste de tous les utilisateurs:');
      
      const allUsersSnapshot = await usersRef.get();
      allUsersSnapshot.forEach(doc => {
        const userData = doc.data();
        console.log(`- ID: ${doc.id}, Email: ${userData.email}, Role: ${userData.role}, Active: ${userData.isActive}`);
      });
    } else {
      const adminDoc = snapshot.docs[0];
      const adminData = adminDoc.data();
      console.log(`✅ Utilisateur admin trouvé:`);
      console.log(`   - ID: ${adminDoc.id}`);
      console.log(`   - Email: ${adminData.email}`);
      console.log(`   - Role: ${adminData.role}`);
      console.log(`   - Active: ${adminData.isActive}`);
      console.log(`   - Created: ${adminData.createdAt}`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    console.log('🏁 Vérification terminée');
  }
}

checkAdminUser();
