const admin = require('firebase-admin');

// Initialiser Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'gestionadminastration',
  });
}

const db = admin.firestore();

async function createScolariteTarifs() {
  try {
    console.log('🔧 Création des tarifs de scolarité...\n');

    // Récupérer l'année scolaire actuelle
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;
    
    console.log(`📅 Année scolaire: ${academicYear}\n`);

    // Vérifier si les tarifs existent déjà
    const existingTarifs = await db
      .collection('tarifs')
      .where('type', '==', 'Scolarité')
      .where('isActive', '==', true)
      .get();

    if (!existingTarifs.empty) {
      console.log('✅ Des tarifs de scolarité existent déjà:');
      existingTarifs.forEach(doc => {
        const data = doc.data();
        console.log(`   - ${data.nom}: ${data.montant} MAD`);
      });
      console.log('\n❓ Voulez-vous créer de nouveaux tarifs ? (y/N)');
      return;
    }

    // Créer les tarifs de scolarité
    const tarifs = [
      {
        nom: 'Frais Inscription',
        description: 'Frais d\'inscription pour l\'année scolaire',
        montant: 2000, // 2000 MAD par défaut
        type: 'Scolarité',
        niveau: 'Tous',
        annee_scolaire: academicYear,
        isActive: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nom: 'Frais scolaire',
        description: 'Frais de scolarité pour l\'année scolaire',
        montant: 8000, // 8000 MAD par défaut
        type: 'Scolarité',
        niveau: 'Tous',
        annee_scolaire: academicYear,
        isActive: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    console.log('📝 Création des tarifs:');
    for (const tarif of tarifs) {
      console.log(`   - ${tarif.nom}: ${tarif.montant} MAD`);
      
      const docRef = await db.collection('tarifs').add(tarif);
      console.log(`     ✅ Créé avec l'ID: ${docRef.id}`);
    }

    const totalFees = tarifs.reduce((sum, tarif) => sum + tarif.montant, 0);
    
    console.log(`\n💰 Total frais_payment calculé: ${totalFees} MAD`);
    console.log('✅ Tarifs de scolarité créés avec succès !');
    console.log('\n💡 Les nouveaux étudiants auront automatiquement ce montant dans frais_payment.');

  } catch (error) {
    console.error('❌ Erreur lors de la création des tarifs:', error);
  }
}

// Exécuter la création
createScolariteTarifs().then(() => {
  console.log('\n🏁 Création terminée.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
