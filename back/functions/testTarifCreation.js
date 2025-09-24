const axios = require('axios');

const API_BASE_URL = "http://127.0.0.1:5001/gestionadminastration/us-central1/api/v1";
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "password123";

let adminToken = "";

async function loginAdmin() {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });
        adminToken = response.data.token;
        console.log("✅ Connexion réussie, token obtenu");
        return true;
    } catch (error) {
        console.error("❌ Erreur de connexion admin:", error.response ? error.response.data : error.message);
        return false;
    }
}

async function testTarifCreation() {
    try {
        const tarifData = {
            nom: "Frais d'inscription",
            montant: 1500,
            annee_scolaire: "2024-2025",
            type: "Scolarité",
            nationalite: null,
            bourse_id: null,
            reductions: []
        };

        const config = {
            method: 'POST',
            url: `${API_BASE_URL}/tarifs`,
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            data: tarifData
        };

        const response = await axios(config);
        console.log("✅ Création de tarif réussie:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Erreur création tarif:", error.response ? `${error.response.status} ${error.response.data.message}` : error.message);
        if (error.response && error.response.data) {
            console.error("Détails de l'erreur:", error.response.data);
        }
        return null;
    }
}

async function runTest() {
    console.log("🧪 Test de création de tarif avec le champ 'nom'...");

    if (!(await loginAdmin())) {
        console.log("Arrêt du test car la connexion admin a échoué.");
        return;
    }

    console.log("\n2. Test création de tarif...");
    await testTarifCreation();
}

runTest();
