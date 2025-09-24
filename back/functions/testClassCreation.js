const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5001/gestionadminastration/us-central1/api/v1';

async function testClassCreation() {
  try {
    console.log('🧪 Test de création de classe avec authentification...');
    
    // 1. Se connecter pour obtenir un token valide
    console.log('\n1. Connexion admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@gmail.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.status) {
      console.log('❌ Échec de la connexion:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Connexion réussie, token obtenu');
    
    // 2. Tester la récupération des classes
    console.log('\n2. Test récupération des classes...');
    try {
      const classesResponse = await axios.get(`${BASE_URL}/classes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Classes récupérées:', classesResponse.data.data?.length || 0, 'classes');
    } catch (error) {
      console.log('❌ Erreur récupération classes:', error.response?.status, error.response?.data?.message || error.message);
    }
    
    // 3. Tester la création d'une classe
    console.log('\n3. Test création de classe...');
    const newClass = {
      nom: 'B1 Informatique',
      niveau: '1ère année',
      capacite: 60,
      description: 'Promotion B1 full stack',
      annee_scolaire: '2026'
    };
    
    try {
      const createResponse = await axios.post(`${BASE_URL}/classes`, newClass, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Classe créée avec succès:', createResponse.data);
    } catch (error) {
      console.log('❌ Erreur création classe:', error.response?.status, error.response?.data?.message || error.message);
      if (error.response?.data) {
        console.log('Détails de l\'erreur:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    // 4. Tester l'endpoint users/pending
    console.log('\n4. Test endpoint users/pending...');
    try {
      const pendingResponse = await axios.get(`${BASE_URL}/users/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Users/pending accessible:', pendingResponse.data.data?.length || 0, 'utilisateurs en attente');
    } catch (error) {
      console.log('❌ Erreur users/pending:', error.response?.status, error.response?.data?.message || error.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
    if (error.response) {
      console.error('Détails de la réponse:', error.response.data);
    }
  }
}

testClassCreation();
