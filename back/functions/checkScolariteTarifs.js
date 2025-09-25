const admin = require('firebase-admin');

// Initialiser Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'gestionadminastration',
  });
}

const db = admin.firestore();

async function checkScolariteTarifs() {
  try {
    console.log('🔍 Vérification des tarifs de scolarité...\n');

    // Récupérer l'année scolaire actuelle
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;
    
    console.log(`📅 Année scolaire: ${academicYear}\n`);

    // Récupérer tous les tarifs de type "Scolarité"
    const tarifsSnapshot = await db
      .collection('tarifs')
      .where('type', '==', 'Scolarité')
      .where('isActive', '==', true)
      .get();

    if (tarifsSnapshot.empty) {
      console.log('❌ Aucun tarif de type "Scolarité" trouvé !');
      console.log('\n📝 Pour créer les tarifs manquants, exécutez:');
      console.log('node createScolariteTarifs.js');
      return;
    }

    console.log(`✅ ${tarifsSnapshot.size} tarif(s) de type "Scolarité" trouvé(s):\n`);

    let fraisInscription = 0;
    let fraisScolarite = 0;
    let totalFees = 0;

    tarifsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`📋 ${data.nom}:`);
      console.log(`   - Montant: ${data.montant} MAD`);
      console.log(`   - Type: ${data.type}`);
      console.log(`   - Année: ${data.annee_scolaire}`);
      console.log(`   - Actif: ${data.isActive}`);
      console.log('');

      if (data.nom === 'Frais Inscription') {
        fraisInscription = data.montant;
      } else if (data.nom === 'Frais scolaire') {
        fraisScolarite = data.montant;
      }
    });

    totalFees = fraisInscription + fraisScolarite;

    console.log('💰 Résumé du calcul automatique:');
    console.log(`   - Frais d'inscription: ${fraisInscription} MAD`);
    console.log(`   - Frais de scolarité: ${fraisScolarite} MAD`);
    console.log(`   - Total frais_payment: ${totalFees} MAD\n`);

    if (fraisInscription === 0) {
      console.log('⚠️  Attention: Aucun "Frais Inscription" trouvé !');
    }
    if (fraisScolarite === 0) {
      console.log('⚠️  Attention: Aucun "Frais scolaire" trouvé !');
    }

    if (fraisInscription > 0 && fraisScolarite > 0) {
      console.log('✅ Configuration parfaite ! Le calcul automatique fonctionnera correctement.');
    } else {
      console.log('❌ Configuration incomplète ! Créez les tarifs manquants.');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

// Exécuter la vérification
checkScolariteTarifs().then(() => {
  console.log('\n🏁 Vérification terminée.');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
