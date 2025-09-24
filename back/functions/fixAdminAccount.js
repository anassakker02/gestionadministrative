const admin = require('firebase-admin');

// Initialiser Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'gestionadminastration',
  });
}

const db = admin.firestore();

async function fixAdminAccount() {
  try {
    console.log('🔧 Correction du compte admin...');
    
    // Trouver le compte admin
    const usersSnapshot = await db.collection('users').where('email', '==', 'admin@gmail.com').get();
    
    if (usersSnapshot.empty) {
      console.log('❌ Aucun compte admin trouvé');
      return;
    }
    
    const adminDoc = usersSnapshot.docs[0];
    const adminData = adminDoc.data();
    
    console.log('📋 Compte admin trouvé:', {
      id: adminDoc.id,
      email: adminData.email,
      role: adminData.role,
      isActive: adminData.isActive
    });
    
    // Mettre à jour le compte admin
    await adminDoc.ref.update({
      isActive: true,
      updatedAt: new Date()
    });
    
    console.log('✅ Compte admin corrigé avec succès !');
    console.log('🎯 Vous pouvez maintenant vous connecter avec:');
    console.log('   - Email: admin@gmail.com');
    console.log('   - Mot de passe: password123');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

fixAdminAccount().then(() => {
  console.log('🏁 Correction terminée');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
});
