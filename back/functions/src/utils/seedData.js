// Use the initialized Firestore instance from config to ensure admin.initializeApp() has been called
const db = require("../config/firebase");
const bcrypt = require("bcrypt");

// Petit helper pour garder la compatibilité des champs front/back
function buildInvoiceCompatFields({
  etudiant_id,
  parent_user_id,
  numero,
  date_emission,
  montant_total,
  montantPaye,
  montantRestant,
  statut,
  items,
  anneeScolaire,
  currency = "MAD",
  extra = {},
}) {
  // Calcule somme des lignes si possible (fallback sur montant_total)
  const somme = Array.isArray(items)
    ? items.reduce((acc, it) => acc + Number(it.total || it.montant || 0), 0)
    : Number(montant_total) || 0;
  return {
    // IDs étudiant: les deux variantes pour compat
    etudiant_id,
    student_id: etudiant_id,
    // Parent: les deux variantes
    parent_id: parent_user_id || null,
    parentId: parent_user_id || null,
    // Numéro: les deux variantes
    numero,
    numero_facture: numero,
    // Dates et montants
    date_emission,
    montant_total,
    montantPaye,
    montantRestant,
    // Nouveaux champs trio sur facture
    montant_du: Number(montant_total) || 0,
    montant_payee: Number(montantPaye) || 0,
    montant_restant: Number(montantRestant) || 0,
    // Somme des items
    somme,
    statut,
    items: Array.isArray(items) ? items : [],
    currency,
    anneeScolaire,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...extra,
  };
}

async function seedFirestore() {
  try {
    console.log("🚀 Début du seed Firestore...");
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    // Define academic year at the beginning
    const currentYear = new Date().getFullYear();
    const academicYear = `${currentYear}-${currentYear + 1}`;

    // Nettoyage collections principales - Version ultra simplifiée
    console.log("⏳ Nettoyage des collections...");
    const collections = [
      "users",
      "etudiants",
      "bourses",
      "classes",
      "tarifs",
      "paiements",
    ];
    for (const col of collections) {
      console.log(`   - Nettoyage de la collection: ${col}...`);
      const snapshot = await db.collection(col).get();
      if (snapshot.empty) {
        console.log(`     ✅ Déjà vide`);
        continue;
      }
      
      const chunks = [];
      const size = 400; // Conservatively below 500 limit
      for (let i = 0; i < snapshot.docs.length; i += size) {
        chunks.push(snapshot.docs.slice(i, i + size));
      }

      for (const chunk of chunks) {
        const batch = db.batch();
        chunk.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
      console.log(`     ✅ Vidée (${snapshot.docs.length} docs)`);
    }

    // === VERSION ULTRA SIMPLIFIÉE ===
    // Seulement admin et étudiants, aucune autre table

    // === USERS === (ids stables) - Version simplifiée
    console.log("⏳ Insérant les utilisateurs...");
    const users = [
      {
        id: "admin_user",
        prenom: "Admin",
        nom: "Système",
        email: "admin@gmail.com",
        role: "admin",
        isActive: true, // Admin actif par défaut
      },
      {
        id: "omar_benali_user",
        prenom: "Omar",
        nom: "Benali",
        email: "omar.benali@example.com",
        role: "etudiant",
        isActive: true, // Étudiants actifs par défaut
      },
      {
        id: "fatima_zahra_user",
        prenom: "Fatima",
        nom: "Zahra",
        email: "fatima.zahra@example.com",
        role: "etudiant",
        isActive: true, // Étudiants actifs par défaut
      },
      {
        id: "mohamed_mellouk_user",
        prenom: "Mohamed",
        nom: "Mellouk",
        email: "mohamed.mellouk@example.com",
        role: "etudiant",
        isActive: true, // Étudiants actifs par défaut
      },
      {
        id: "ahmed_alami_user",
        prenom: "Ahmed",
        nom: "Alami",
        email: "ahmed.alami@example.com",
        role: "etudiant",
        isActive: true, // Étudiant actif
      },
      {
        id: "sara_benjelloun_user",
        prenom: "Sara",
        nom: "Benjelloun",
        email: "sara.benjelloun@example.com",
        role: "etudiant",
        isActive: false, // Étudiant inactif
      },
      {
        id: "parent_benjelloun_user",
        prenom: "Hassan",
        nom: "Benjelloun",
        email: "hassan.benjelloun@example.com",
        role: "parent",
        isActive: true, // Parent actif
        telephone: "+212 6 12 34 56 78",
        adresse: "123 Avenue Mohammed V, Casablanca",
        // Relation avec l'étudiant
        etudiant_id: "std-sara-benjelloun",
      },
    ];

    const userIdMap = {};
    for (const user of users) {
      const ref = db.collection("users").doc(user.id);
      await ref.set({
        ...user,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Garder le statut isActive défini dans le tableau users
        status: user.isActive ? "active" : "inactive",
      });
      userIdMap[user.id] = ref.id;
    }
    console.log("✅ Utilisateurs insérés");

    // === BOURSES === (3 bourses)
    console.log("⏳ Insérant les bourses...");
    const bourses = [
      {
        id: "bourse_excellence",
        nom: "Bourse d'Excellence",
        description: "Bourse pour les étudiants avec d'excellents résultats",
        pourcentage_remise: 50, // 50% de réduction
        montant_remise: null,
        isExempt: false,
        isActive: true,
      },
      {
        id: "bourse_sociale",
        nom: "Bourse Sociale",
        description: "Bourse pour les étudiants en situation difficile",
        pourcentage_remise: null,
        montant_remise: 10000, // 10,000 DH de réduction fixe
        isExempt: false,
        isActive: true,
      },
      {
        id: "bourse_complete",
        nom: "Bourse Complète",
        description: "Exonération totale des frais",
        pourcentage_remise: null,
        montant_remise: null,
        isExempt: true, // Exonération totale
        isActive: true,
      },
    ];

    const bourseIdMap = {};
    for (const bourse of bourses) {
      const ref = db.collection("bourses").doc();
      await ref.set({
        nom: bourse.nom,
        description: bourse.description,
        pourcentage_remise: bourse.pourcentage_remise,
        montant_remise: bourse.montant_remise,
        isExempt: bourse.isExempt,
        isActive: bourse.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      bourseIdMap[bourse.id] = ref.id; // Garder la correspondance pour les étudiants
    }
    console.log("✅ Bourses insérées");

    // === CLASSES === (5 classes de différents niveaux)
    console.log("⏳ Insérant les classes...");
    const classes = [
      {
        id: "classe_6eme",
        nom: "6ème Année",
        niveau: "6ème",
        description: "Classe de 6ème année - Niveau débutant",
        capacite_max: 30,
        annee_scolaire: academicYear,
        isActive: true,
      },
      {
        id: "classe_5eme",
        nom: "5ème Année",
        niveau: "5ème",
        description: "Classe de 5ème année - Niveau intermédiaire",
        capacite_max: 30,
        annee_scolaire: academicYear,
        isActive: true,
      },
      {
        id: "classe_4eme",
        nom: "4ème Année",
        niveau: "4ème",
        description: "Classe de 4ème année - Niveau avancé",
        capacite_max: 30,
        annee_scolaire: academicYear,
        isActive: true,
      },
      {
        id: "classe_3eme",
        nom: "3ème Année",
        niveau: "3ème",
        description: "Classe de 3ème année - Niveau expert",
        capacite_max: 30,
        annee_scolaire: academicYear,
        isActive: true,
      },
      {
        id: "classe_2nde",
        nom: "2nde Année",
        niveau: "2nde",
        description: "Classe de 2nde année - Niveau supérieur",
        capacite_max: 30,
        annee_scolaire: academicYear,
        isActive: true,
      },
    ];

    const classeIdMap = {};
    for (const classe of classes) {
      const ref = db.collection("classes").doc(classe.id);
      await ref.set({
        nom: classe.nom,
        niveau: classe.niveau,
        description: classe.description,
        capacite_max: classe.capacite_max,
        annee_scolaire: classe.annee_scolaire,
        isActive: classe.isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      classeIdMap[classe.id] = ref.id; // Garder la correspondance pour les étudiants
    }
    console.log("✅ Classes insérées");

    // === TARIFS === (2 tarifs : frais scolarité et frais inscription)
    const tarifs = [
      {
        id: "tarif_frais_scolarite",
        nom: "Frais scolaire",
        type: "Scolarité",
        montant: 59590,
        annee_scolaire: academicYear,
        nationalite: "Marocain",
        isActive: true,
      },
      {
        id: "tarif_frais_inscription",
        nom: "Frais Inscription",
        type: "Scolarité",
        montant: 800,
        annee_scolaire: academicYear,
        nationalite: "Marocain",
        isActive: true,
      },
    ];

    for (const tarif of tarifs) {
      const ref = db.collection("tarifs").doc(tarif.id);
      await ref.set({
        ...tarif,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log("✅ Tarifs insérés");

    // === ETUDIANTS === (version ultra simplifiée - 3 étudiants basiques)
    const etudiants = [
      {
        id: "std-omar-benali",
        user_id: userIdMap["omar_benali_user"],
        nom: "Benali",
        prenom: "Omar",
        email: "omar.benali@example.com",
        telephone: "+212610000001",
        adresse: "123 Rue de la Paix, Casablanca",
        date_naissance: new Date("2005-09-15"),
        nationalite: "Marocaine",
        code_massar: "2024001",
        classe_id: classeIdMap["classe_6eme"], // Assigné à la 6ème année
        bourse_id: bourseIdMap["bourse_excellence"], // Bourse d'excellence (50% de réduction)
        frais_payment: 30195, // 60390 * 0.5 = 30195 DH
      },
      {
        id: "std-fatima-zahra",
        user_id: userIdMap["fatima_zahra_user"],
        nom: "Zahra",
        prenom: "Fatima",
        email: "fatima.zahra@example.com",
        telephone: "+212610000002",
        adresse: "456 Avenue Royale, Rabat",
        date_naissance: new Date("2004-03-20"),
        nationalite: "Marocaine",
        code_massar: "2024002",
        classe_id: classeIdMap["classe_5eme"], // Assigné à la 5ème année
        bourse_id: bourseIdMap["bourse_sociale"], // Bourse sociale (10,000 DH de réduction)
        frais_payment: 50390, // 60390 - 10000 = 50390 DH
      },
      {
        id: "std-mohamed-mellouk",
        user_id: userIdMap["mohamed_mellouk_user"],
        nom: "Mellouk",
        prenom: "Mohamed",
        email: "mohamed.mellouk@example.com",
        telephone: "+212610000004",
        adresse: "101 Avenue Mohammed V, Marrakech",
        date_naissance: new Date("2005-07-22"),
        nationalite: "Marocaine",
        code_massar: "2024004",
        classe_id: classeIdMap["classe_4eme"], // Assigné à la 4ème année
        bourse_id: bourseIdMap["bourse_complete"], // Bourse complète (exonération totale)
        frais_payment: 0, // Exonération totale
      },
      {
        id: "std-ahmed-alami",
        user_id: userIdMap["ahmed_alami_user"],
        nom: "Alami",
        prenom: "Ahmed",
        email: "ahmed.alami@example.com",
        telephone: "+212610000005",
        adresse: "789 Boulevard Zerktouni, Casablanca",
        date_naissance: new Date("2004-11-10"),
        nationalite: "Marocaine",
        code_massar: "2024005",
        classe_id: classeIdMap["classe_6eme"], // Assigné à la 6ème année
        bourse_id: null, // Pas de bourse
        frais_payment: 60390, // Frais complets
      },
      {
        id: "std-sara-benjelloun",
        user_id: userIdMap["sara_benjelloun_user"],
        nom: "Benjelloun",
        prenom: "Sara",
        email: "sara.benjelloun@example.com",
        telephone: "+212610000006",
        adresse: "321 Rue Hassan II, Fès",
        date_naissance: new Date("2003-05-18"),
        nationalite: "Marocaine",
        code_massar: "2024006",
        classe_id: classeIdMap["classe_5eme"], // Assigné à la 5ème année
        bourse_id: bourseIdMap["bourse_sociale"], // Bourse sociale
        frais_payment: 50390, // 60390 - 10000 = 50390 DH
      },
    ];

    for (const etu of etudiants) {
      const ref = db.collection("etudiants").doc(etu.id);
      await ref.set({
        ...etu,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log("✅ Etudiants insérés avec bourses et frais_payment");

    // === PAIEMENTS === (2 paiements pour Ahmed Alami et Sara Benjelloun)
    const paiements = [
      // Paiements pour Ahmed Alami (étudiant actif)
      {
        id: "paiement-ahmed-1",
        etudiant_id: "std-ahmed-alami",
        student_id: "std-ahmed-alami", // Compatibilité
        montantPaye: 30000, // 30,000 DH
        methode: "Virement bancaire",
        numeroReference: "VIR-2024-001",
        notes: "Premier paiement - Frais d'inscription",
        status: "valide",
        date: new Date("2024-09-15"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "paiement-ahmed-2",
        etudiant_id: "std-ahmed-alami",
        student_id: "std-ahmed-alami", // Compatibilité
        montantPaye: 15000, // 15,000 DH
        methode: "Espèces",
        numeroReference: "ESP-2024-002",
        notes: "Deuxième paiement - Frais de scolarité partiel",
        status: "valide",
        date: new Date("2024-10-20"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      // Paiements pour Sara Benjelloun (étudiant inactif)
      {
        id: "paiement-sara-1",
        etudiant_id: "std-sara-benjelloun",
        student_id: "std-sara-benjelloun", // Compatibilité
        montantPaye: 25000, // 25,000 DH
        methode: "Chèque",
        numeroReference: "CHQ-2024-003",
        notes: "Paiement initial avant suspension",
        status: "valide",
        date: new Date("2024-09-10"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "paiement-sara-2",
        etudiant_id: "std-sara-benjelloun",
        student_id: "std-sara-benjelloun", // Compatibilité
        montantPaye: 10000, // 10,000 DH
        methode: "Virement bancaire",
        numeroReference: "VIR-2024-004",
        notes: "Paiement partiel avant suspension du compte",
        status: "valide",
        date: new Date("2024-10-05"),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    for (const paiement of paiements) {
      const ref = db.collection("paiements").doc(paiement.id);
      await ref.set(paiement);
    }
    console.log("✅ Paiements insérés (2 paiements par étudiant)");

    console.log("🎉 Seed Firestore terminé avec succès !");
    console.log("📊 Données créées :");
    console.log("   - 6 utilisateurs (1 admin + 5 étudiants)");
    console.log("   - 3 bourses (Excellence, Sociale, Complète)");
    console.log("   - 5 étudiants (3 actifs + 2 nouveaux avec statuts différents)");
    console.log("   - 4 paiements (2 pour Ahmed Alami, 2 pour Sara Benjelloun)");
    console.log("   - 5 classes (6ème, 5ème, 4ème, 3ème, 2nde)");
    console.log("   - 2 tarifs (Frais scolaire: 59,590 DH, Frais Inscription: 800 DH)");
    console.log("   - 3 étudiants avec bourses, classes et frais_payment calculés");
  } catch (err) {
    console.error("❌ Erreur seed:", err);
    throw err;
  }
}

// Export the seeder function afin que seedRunner puisse l'exécuter
module.exports = { seedFirestore };
