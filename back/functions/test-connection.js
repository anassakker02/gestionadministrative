const axios = require('axios');

console.log('🔍 Test de connexion à l\'émulateur Firebase...\n');

const endpoints = [
  'http://127.0.0.1:5001/gestionadminastration/us-central1/api/v1/health',
  'http://localhost:5001/gestionadminastration/us-central1/api/v1/health',
  'http://127.0.0.1:5001/gestionadminastration/us-central1/api/health',
  'http://localhost:5001/gestionadminastration/us-central1/api/health'
];

async function testEndpoint(url) {
  try {
    console.log(`🔍 Test: ${url}`);
    const response = await axios.get(url, { timeout: 5000 });
    console.log(`✅ Succès: ${response.status} - ${url}`);
    return { success: true, url, status: response.status, data: response.data };
  } catch (error) {
    console.log(`❌ Échec: ${error.message} - ${url}`);
    return { success: false, url, error: error.message };
  }
}

async function testAllEndpoints() {
  console.log('📡 Test de tous les endpoints possibles...\n');
  
  const results = [];
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      console.log('\n🎉 Émulateur accessible!');
      console.log(`📍 URL fonctionnelle: ${result.url}`);
      console.log(`📊 Statut: ${result.status}`);
      if (result.data) {
        console.log(`📋 Données:`, result.data);
      }
      return result;
    }
  }
  
  console.log('\n❌ Aucun endpoint accessible');
  console.log('\n💡 Solutions:');
  console.log('1. Vérifiez que l\'émulateur est démarré: firebase emulators:start');
  console.log('2. Vérifiez le port 5001');
  console.log('3. Vérifiez la configuration Firebase');
  console.log('4. Redémarrez l\'émulateur');
  
  return { success: false, results };
}

// Test de connectivité réseau
async function testNetworkConnectivity() {
  console.log('🌐 Test de connectivité réseau...\n');
  
  try {
    // Test de connectivité basique
    const response = await axios.get('http://127.0.0.1:5001', { timeout: 3000 });
    console.log('✅ Port 5001 accessible');
    return true;
  } catch (error) {
    console.log('❌ Port 5001 non accessible');
    console.log('💡 Vérifiez que l\'émulateur Firebase est démarré');
    return false;
  }
}

async function main() {
  console.log('🚀 Début du diagnostic de connexion\n');
  
  // Test de connectivité réseau
  const networkOk = await testNetworkConnectivity();
  console.log('');
  
  if (networkOk) {
    // Test des endpoints spécifiques
    await testAllEndpoints();
  }
  
  console.log('\n📋 Résumé:');
  console.log('- Si tous les tests échouent: l\'émulateur n\'est pas démarré');
  console.log('- Si le port est accessible mais pas l\'API: problème de configuration');
  console.log('- Si l\'API répond: tout fonctionne correctement');
}

main().catch(console.error);
