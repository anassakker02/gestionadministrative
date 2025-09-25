const axios = require('axios');

// Configuration - Ajustez selon votre environnement
const BASE_URL = process.env.API_URL || 'http://localhost:5001';
const API_URL = `${BASE_URL}/api/auth/login`;

// Liste des comptes à tester
const testAccounts = [
  {
    email: 'admin@gmail.com',
    password: 'password123',
    name: 'Admin',
    role: 'admin'
  },
  {
    email: 'omar.benali@example.com',
    password: 'password123',
    name: 'Omar Benali',
    role: 'etudiant'
  },
  {
    email: 'fatima.zahra@example.com',
    password: 'password123',
    name: 'Fatima Zahra',
    role: 'etudiant'
  },
  {
    email: 'mohamed.mellouk@example.com',
    password: 'password123',
    name: 'Mohamed Mellouk',
    role: 'etudiant'
  }
];

async function testLogin(account) {
  try {
    console.log(`🔍 Test de connexion: ${account.name} (${account.email})`);
    
    const response = await axios.post(API_URL, {
      email: account.email,
      password: account.password
    }, {
      timeout: 10000 // 10 secondes de timeout
    });

    if (response.data.status && response.data.user) {
      console.log(`✅ ${account.name}: Connexion réussie`);
      console.log(`   - ID: ${response.data.user.id}`);
      console.log(`   - Email: ${response.data.user.email}`);
      console.log(`   - Role: ${response.data.user.role}`);
      console.log(`   - Token: ${response.data.token ? 'Reçu' : 'Manquant'}`);
      return { success: true, account: account.name, data: response.data };
    } else {
      console.log(`❌ ${account.name}: Réponse invalide`);
      return { success: false, account: account.name, error: 'Réponse invalide' };
    }
    
  } catch (error) {
    console.log(`❌ ${account.name}: Échec de connexion`);
    
    if (error.response) {
      console.log(`   - Status: ${error.response.status}`);
      console.log(`   - Message: ${error.response.data?.message || 'Erreur inconnue'}`);
      return { 
        success: false, 
        account: account.name, 
        error: error.response.data?.message || 'Erreur HTTP' 
      };
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`   - Erreur: Serveur non accessible (${BASE_URL})`);
      return { 
        success: false, 
        account: account.name, 
        error: 'Serveur non accessible' 
      };
    } else {
      console.log(`   - Erreur: ${error.message}`);
      return { 
        success: false, 
        account: account.name, 
        error: error.message 
      };
    }
  }
}

async function testAllLogins() {
  console.log('🚀 Test de connexion pour tous les comptes...\n');
  console.log(`🌐 URL de l'API: ${API_URL}\n`);
  
  const results = [];
  
  for (const account of testAccounts) {
    const result = await testLogin(account);
    results.push(result);
    console.log(''); // Ligne vide pour la lisibilité
  }
  
  // Résumé des résultats
  console.log('📊 RÉSUMÉ DES TESTS:');
  console.log('='.repeat(50));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Connexions réussies: ${successful.length}/${results.length}`);
  successful.forEach(result => {
    console.log(`   - ${result.account}`);
  });
  
  if (failed.length > 0) {
    console.log(`\n❌ Connexions échouées: ${failed.length}/${results.length}`);
    failed.forEach(result => {
      console.log(`   - ${result.account}: ${result.error}`);
    });
  }
  
  console.log('\n🎯 RECOMMANDATIONS:');
  if (failed.length === 0) {
    console.log('   🎉 Tous les comptes fonctionnent parfaitement !');
  } else {
    console.log('   🔧 Vérifiez que:');
    console.log('     1. Le serveur backend est démarré');
    console.log('     2. Les données de seed ont été correctement insérées');
    console.log('     3. L\'URL de l\'API est correcte');
    console.log('     4. Les emails et mots de passe sont corrects');
  }
  
  return results;
}

// Exécuter si le script est appelé directement
if (require.main === module) {
  testAllLogins()
    .then((results) => {
      const allSuccess = results.every(r => r.success);
      process.exit(allSuccess ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Erreur lors des tests:', error);
      process.exit(1);
    });
}

module.exports = { testAllLogins, testLogin };
