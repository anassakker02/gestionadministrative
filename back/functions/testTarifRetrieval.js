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

async function testTarifRetrieval() {
    try {
        const config = {
            method: 'GET',
            url: `${API_BASE_URL}/tarifs`,
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            }
        };

        const response = await axios(config);
        console.log("✅ Récupération des tarifs réussie:");
        console.log(`   - Nombre de tarifs: ${response.data.data.length}`);
        console.log("   - Tarifs trouvés:");
        response.data.data.forEach((tarif, index) => {
            console.log(`     ${index + 1}. ${tarif.nom || 'Sans nom'} - ${tarif.montant} DH (${tarif.type})`);
        });
        return response.data;
    } catch (error) {
        console.error("❌ Erreur récupération tarifs:", error.response ? `${error.response.status} ${error.response.data.message}` : error.message);
        if (error.response && error.response.data) {
            console.error("Détails de l'erreur:", error.response.data);
        }
        return null;
    }
}

async function createTestTarifs() {
    const tarifsToCreate = [
        {
            nom: "Frais d'inscription",
            montant: 1500,
            annee_scolaire: "2024-2025",
            type: "Scolarité"
        },
        {
            nom: "Frais de scolarité",
            montant: 5000,
            annee_scolaire: "2024-2025",
            type: "Scolarité"
        },
        {
            nom: "Frais de cantine",
            montant: 800,
            annee_scolaire: "2024-2025",
            type: "Cantine"
        }
    ];

    console.log("\n📝 Création de tarifs de test...");
    for (const tarifData of tarifsToCreate) {
        try {
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
            console.log(`✅ Créé: ${tarifData.nom} - ${tarifData.montant} DH`);
        } catch (error) {
            console.error(`❌ Erreur création ${tarifData.nom}:`, error.response ? error.response.data.message : error.message);
        }
    }
}

async function runTest() {
    console.log("🧪 Test de récupération des tarifs...");

    if (!(await loginAdmin())) {
        console.log("Arrêt du test car la connexion admin a échoué.");
        return;
    }

    console.log("\n1. Récupération des tarifs existants...");
    await testTarifRetrieval();

    console.log("\n2. Création de tarifs de test...");
    await createTestTarifs();

    console.log("\n3. Récupération après création...");
    await testTarifRetrieval();
}

runTest();
