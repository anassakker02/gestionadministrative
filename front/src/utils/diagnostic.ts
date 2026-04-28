// Script de diagnostic pour tester la connexion API
export const runDiagnostic = async () => {
  console.log('🔍 Diagnostic de la connexion API...\n');

  // Test 1: Health Check
  console.log('1️⃣ Test Health Check...');
  try {
    const healthResponse = await fetch('/gestionadminastration/us-central1/api/v1/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health Check réussi:', healthData);
  } catch (error) {
    console.log('❌ Health Check échoué:', error);
  }

  // Test 2: Login
  console.log('\n2️⃣ Test Login...');
  try {
    const loginResponse = await fetch('/gestionadminastration/us-central1/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@gmail.com',
        password: 'password123'
      })
    });
    const loginData = await loginResponse.json();
    console.log('✅ Login réussi:', loginData);
  } catch (error) {
    console.log('❌ Login échoué:', error);
  }

  // Test 3: Test direct vers l'émulateur
  console.log('\n3️⃣ Test direct vers l\'émulateur...');
  try {
    const directResponse = await fetch('http://127.0.0.1:5001/gestionadminastration/us-central1/api/v1/health');
    const directData = await directResponse.json();
    console.log('✅ Connexion directe réussi:', directData);
  } catch (error) {
    console.log('❌ Connexion directe échouée:', error);
  }

  console.log('\n📋 Résumé:');
  console.log('- Si le test 1 et 2 fonctionnent : le proxy Vite fonctionne');
  console.log('- Si seul le test 3 fonctionne : problème avec le proxy Vite');
  console.log('- Si aucun test ne fonctionne : l\'émulateur n\'est pas accessible');
};

// Fonction pour tester depuis la console du navigateur
(window as any).testAPI = runDiagnostic;
