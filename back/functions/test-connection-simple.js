const axios = require('axios');

console.log('🧪 Test de connexion avec l\'émulateur simplifié...\n');

const baseUrl = 'http://127.0.0.1:5001/gestionadminastration/us-central1/api/v1';

async function testEndpoint(name, url, method = 'GET', data = null) {
  try {
    console.log(`🔍 Test: ${name}`);
    console.log(`📍 URL: ${url}`);
    
    const config = {
      method,
      url,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    console.log(`✅ Succès: ${response.status}`);
    console.log(`📊 Données:`, JSON.stringify(response.data, null, 2));
    console.log('');
    return { success: true, data: response.data };
  } catch (error) {
    console.log(`❌ Échec: ${error.message}`);
    if (error.response) {
      console.log(`📊 Statut: ${error.response.status}`);
      console.log(`📋 Données:`, error.response.data);
    }
    console.log('');
    return { success: false, error: error.message };
  }
}

async function testLogin() {
  console.log('🔐 Test de login...');
  const loginData = {
    email: "admin@gmail.com",
    password: "password123"
  };
  
  const result = await testEndpoint('Login', `${baseUrl}/auth/login`, 'POST', loginData);
  
  if (result.success && result.data.token) {
    console.log('✅ Login réussi, token obtenu');
    return result.data.token;
  } else {
    console.log('❌ Login échoué');
    return null;
  }
}

async function testProtectedEndpoint(token) {
  if (!token) {
    console.log('⚠️  Pas de token, test des endpoints protégés ignoré');
    return;
  }
  
  console.log('🔒 Test des endpoints protégés...');
  await testEndpoint('Users', `${baseUrl}/users`, 'GET', null, {
    'Authorization': `Bearer ${token}`
  });
}

async function main() {
  console.log('🚀 Début des tests de connexion\n');
  
  // Test des endpoints publics
  const tests = [
    { name: 'Health Check', url: `${baseUrl}/health` },
    { name: 'Diagnostic', url: `${baseUrl}/diagnostic` },
    { name: 'Test', url: `${baseUrl}/test` },
    { name: 'Users (public)', url: `${baseUrl}/users` }
  ];
  
  const results = [];
  for (const test of tests) {
    const result = await testEndpoint(test.name, test.url);
    results.push({ ...test, ...result });
  }
  
  // Test de login
  const token = await testLogin();
  
  // Test des endpoints protégés
  if (token) {
    await testProtectedEndpoint(token);
  }
  
  // Résumé
  console.log('📋 Résumé des tests:');
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Endpoints fonctionnels: ${successCount}/${results.length}`);
  
  if (successCount > 0) {
    console.log('\n🎉 L\'émulateur fonctionne!');
    console.log('💡 Le frontend devrait pouvoir se connecter');
    console.log('🌐 Testez dans le navigateur:');
    console.log(`   ${baseUrl}/health`);
  } else {
    console.log('\n❌ Aucun endpoint accessible');
    console.log('💡 Vérifiez que l\'émulateur est démarré');
  }
}

main().catch(console.error);
