const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5001/gestionadminastration/us-central1/api/v1';

async function testEndpoints() {
  try {
    console.log('🧪 Test des endpoints...');
    
    // Test de l'endpoint des classes
    console.log('\n1. Test endpoint classes:');
    try {
      const response = await axios.get(`${BASE_URL}/classes`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Classes endpoint accessible:', response.status);
    } catch (error) {
      console.log('❌ Classes endpoint error:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test de l'endpoint des utilisateurs en attente
    console.log('\n2. Test endpoint users/pending:');
    try {
      const response = await axios.get(`${BASE_URL}/users/pending`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Users/pending endpoint accessible:', response.status);
    } catch (error) {
      console.log('❌ Users/pending endpoint error:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // Test de l'endpoint des utilisateurs
    console.log('\n3. Test endpoint users:');
    try {
      const response = await axios.get(`${BASE_URL}/users`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Users endpoint accessible:', response.status);
    } catch (error) {
      console.log('❌ Users endpoint error:', error.response?.status, error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testEndpoints();
