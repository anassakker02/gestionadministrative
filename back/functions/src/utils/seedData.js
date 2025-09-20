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

    // Nettoyage collections principales
    const collections = [
      "users",
      "etudiants",
      "classes",
      "factures",
      "paiements",
      "parents",
      "tarifs",
      "auditLogs",
    ];
    for (const col of collections) {
      const snapshot = await db.collection(col).get();
      const batch = db.batch();
      snapshot.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      console.log(`✅ Collection ${col} vidée`);
    }

    // === ANNÉE SCOLAIRE ===
    const anneeScolaire = "2024-2025";

    // === CLASSES === (ids stables)
    const classes = [
      { id: "L1-INFO", nom: "L1 Informatique", niveau: "1ère année" },
      { id: "L2-DESIGN", nom: "L2 Design", niveau: "2ème année" },
      { id: "L3-INFO", nom: "L3 Informatique", niveau: "3ème année" },
      { id: "M1-MATH", nom: "M1 Mathématiques", niveau: "Master 1" },
      { id: "M2-INFO", nom: "M2 Informatique", niveau: "Master 2" },
    ];

    const classeIdMap = {};
    for (const cls of classes) {
      const ref = db.collection("classes").doc(cls.id);
      await ref.set({
        nom: cls.nom,
        niveau: cls.niveau,
        anneeScolaire,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      classeIdMap[cls.id] = ref.id;
    }
    console.log("✅ Classes insérées");

    // === USERS === (ids stables)
    const users = [
      {
        id: "etudiant1_user",
        prenom: "Premier",
        nom: "Etudiant",
        email: "etudiant1@ecole.com",
        role: "etudiant",
      },
      {
        id: "etudiant2_user",
        prenom: "Deuxième",
        nom: "Etudiant",
        email: "etudiant2@ecole.com",
        role: "etudiant",
      },
      {
        id: "etudiant3_user",
        prenom: "Troisième",
        nom: "Etudiant",
        email: "etudiant3@ecole.com",
        role: "etudiant",
      },
      {
        id: "parent1_user",
        prenom: "Ali",
        nom: "Parent",
        email: "parent1@gmail.com",
        role: "parent",
      },
      {
        id: "parent2_user",
        prenom: "Sophie",
        nom: "Parent",
        email: "parent2@gmail.com",
        role: "parent",
      },
      {
        id: "admin_user",
        prenom: "Admin",
        nom: "Système",
        email: "admin@gmail.com",
        role: "admin",
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
        isActive: true,
        status: user.role === "admin" ? "active" : "active",
      });
      userIdMap[user.id] = ref.id;
    }
    console.log("✅ Utilisateurs insérés");

    // === PARENTS === (entités dédiées, référencent users)
    const parents = [
      {
        id: "parent1",
        user_id: userIdMap["parent1_user"],
        nom: "Parent",
        prenom: "Ali",
        email: "parent1@gmail.com",
        telephone: "0600000001",
        adresse: "10 Rue des Parents",
        profession: "Comptable",
        enfants_ids: [],
      },
      {
        id: "parent2",
        user_id: userIdMap["parent2_user"],
        nom: "Parent",
        prenom: "Sophie",
        email: "parent2@gmail.com",
        telephone: "0600000002",
        adresse: "20 Avenue des Parents",
        profession: "Ingénieure",
        enfants_ids: [],
      },
    ];

    const parentIdMap = {};
    for (const p of parents) {
      const ref = db.collection("parents").doc(p.id);
      await ref.set({
        ...p,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      parentIdMap[p.id] = ref.id;
    }
    console.log("✅ Parents insérés");

    // === ETUDIANTS === (ids stables + champs normalisés)
    const etudiants = [
      {
        id: "etudiant1",
        user_id: userIdMap["etudiant1_user"],
        nom: "Etudiant",
        prenom: "Premier",
        email: "etudiant1@ecole.com",
        telephone: "0612345678",
        adresse: "123 Rue de la Paix",
        date_naissance: new Date("2005-01-15"),
        classe_id: classeIdMap["L1-INFO"],
        nationalite: "Marocaine",
        bourse_id: null,
        parentId: userIdMap["parent1_user"], // on stocke l'id user du parent pour compat
        numero_etudiant: "E2024001",
      },
      {
        id: "etudiant2",
        user_id: userIdMap["etudiant2_user"],
        nom: "Etudiant",
        prenom: "Deuxième",
        email: "etudiant2@ecole.com",
        telephone: "0687654321",
        adresse: "456 Avenue des Champs",
        date_naissance: new Date("2004-05-10"),
        classe_id: classeIdMap["M1-MATH"],
        nationalite: "Française",
        bourse_id: null,
        parentId: userIdMap["parent2_user"],
        numero_etudiant: "E2024002",
      },
      {
        id: "etudiant3",
        user_id: userIdMap["etudiant3_user"],
        nom: "Etudiant",
        prenom: "Troisième",
        email: "etudiant3@ecole.com",
        telephone: "0611223344",
        adresse: "789 Boulevard de la Liberté",
        date_naissance: new Date("2006-02-28"),
        classe_id: classeIdMap["L2-DESIGN"],
        nationalite: "Allemande",
        bourse_id: null,
        parentId: null,
        numero_etudiant: "E2024003",
      },
    ];

    const etudiantIdMap = {};
    for (const etu of etudiants) {
      const ref = db.collection("etudiants").doc(etu.id);
      await ref.set({
        ...etu,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      etudiantIdMap[etu.id] = ref.id;
    }
    // renseigner enfants_ids côté parents
    await db
      .collection("parents")
      .doc("parent1")
      .update({
        enfants_ids: [etudiantIdMap["etudiant1"]],
        updatedAt: new Date(),
      });
    await db
      .collection("parents")
      .doc("parent2")
      .update({
        enfants_ids: [etudiantIdMap["etudiant2"]],
        updatedAt: new Date(),
      });
    console.log("✅ Etudiants insérés");

    // === TARIFS === (par classe: Scolarité=56000, Autres frais=800)
    const tarifsToInsert = [];
    const baseTuition = 56000;
    const otherFees = 800;
    for (const cls of classes) {
      const cid = classeIdMap[cls.id];
      tarifsToInsert.push(
        {
          classe_id: cid,
          montant: baseTuition,
          annee_scolaire: anneeScolaire,
          nationalite: "Toutes",
          bourse_id: null,
          reductions: [],
          type: "Scolarité",
          isActive: true,
          endDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          classe_id: cid,
          montant: otherFees,
          annee_scolaire: anneeScolaire,
          nationalite: "Toutes",
          bourse_id: null,
          reductions: [],
          type: "Autres frais",
          isActive: true,
          endDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      );
    }
    for (const t of tarifsToInsert) {
      await db.collection("tarifs").add(t);
    }
    console.log("✅ Tarifs (56k + 800) insérés pour chaque classe");

    // === FACTURES === (compat champs)
    const facturesData = [
      {
        forcedId: undefined,
        numero: "INV-2024-001",
        etudiant_id: etudiantIdMap["etudiant1"],
        parent_user_id: userIdMap["parent1_user"],
        montant_total: 50000,
        montantPaye: 50000,
        montantRestant: 0,
        statut: "payée",
        date_emission: new Date(),
        items: [
          {
            description: "Frais de scolarité",
            quantity: 1,
            unitPrice: 50000,
            total: 50000,
          },
        ],
      },
      {
        forcedId: "HYwiaE7GlkxUfGnQbv6i",
        numero: "INV-2024-002",
        etudiant_id: etudiantIdMap["etudiant2"],
        parent_user_id: userIdMap["parent2_user"],
        montant_total: 20000,
        montantPaye: 20000,
        montantRestant: 0,
        statut: "payée",
        date_emission: new Date(),
        items: [
          {
            description: "Règlement partiel 1",
            quantity: 1,
            unitPrice: 20000,
            total: 20000,
          },
        ],
      },
      {
        forcedId: "OFM7Iu2DsMd6BpotTVi3",
        numero: "INV-2024-003",
        etudiant_id: etudiantIdMap["etudiant2"],
        parent_user_id: userIdMap["parent2_user"],
        montant_total: 22000,
        montantPaye: 22000,
        montantRestant: 0,
        statut: "payée",
        date_emission: new Date(),
        items: [
          {
            description: "Règlement partiel 2",
            quantity: 1,
            unitPrice: 22000,
            total: 22000,
          },
        ],
      },
      {
        forcedId: "41L2zIFDKwPUekEoxgeU",
        numero: "INV-2024-004",
        etudiant_id: etudiantIdMap["etudiant2"],
        parent_user_id: userIdMap["parent2_user"],
        montant_total: 50000,
        montantPaye: 50000,
        montantRestant: 0,
        statut: "payée",
        date_emission: new Date(),
        items: [
          {
            description: "Règlement partiel 3",
            quantity: 1,
            unitPrice: 50000,
            total: 50000,
          },
        ],
      },
      {
        forcedId: undefined,
        numero: "INV-2024-005",
        etudiant_id: etudiantIdMap["etudiant3"],
        parent_user_id: null,
        montant_total: 48000,
        montantPaye: 20000,
        montantRestant: 28000,
        statut: "partielle",
        date_emission: new Date(),
        items: [
          {
            description: "Frais scolaires",
            quantity: 1,
            unitPrice: 48000,
            total: 48000,
          },
        ],
      },
    ];

    const factureIdByNumero = {};
    for (const f of facturesData) {
      const docRef = f.forcedId
        ? db.collection("factures").doc(f.forcedId)
        : db.collection("factures").doc();
      const payload = buildInvoiceCompatFields({
        etudiant_id: f.etudiant_id,
        parent_user_id: f.parent_user_id,
        numero: f.numero,
        date_emission: f.date_emission,
        montant_total: f.montant_total,
        montantPaye: f.montantPaye,
        montantRestant: f.montantRestant,
        statut: f.statut,
        items: f.items,
        anneeScolaire,
      });
      await docRef.set({ id: docRef.id, ...payload });
      factureIdByNumero[f.numero] = docRef.id;
    }
    console.log("✅ Factures insérées");

    // === PAIEMENTS === (compat champs: etudiant_id, facture_ids, methode)
    const paiements = [
      {
        etudiant_id: etudiantIdMap["etudiant1"],
        facture_ids: [factureIdByNumero["INV-2024-001"]],
        montantPaye: 50000,
        methode: "Virement",
        mode: "Virement", // compat UI éventuelle
        justificatif_url: null,
        qui_a_paye: userIdMap["parent1_user"],
        enregistre_par: userIdMap["admin_user"],
      },
      {
        etudiant_id: etudiantIdMap["etudiant2"],
        facture_ids: [factureIdByNumero["INV-2024-002"]],
        montantPaye: 20000,
        methode: "Espèces",
        mode: "Espèces",
        justificatif_url: null,
        qui_a_paye: userIdMap["parent2_user"],
        enregistre_par: userIdMap["admin_user"],
      },
      {
        etudiant_id: etudiantIdMap["etudiant2"],
        facture_ids: [factureIdByNumero["INV-2024-003"]],
        montantPaye: 22000,
        methode: "Chèque",
        mode: "Chèque",
        justificatif_url: null,
        qui_a_paye: userIdMap["parent2_user"],
        enregistre_par: userIdMap["admin_user"],
      },
      {
        etudiant_id: etudiantIdMap["etudiant2"],
        facture_ids: [factureIdByNumero["INV-2024-004"]],
        montantPaye: 50000,
        methode: "Virement",
        mode: "Virement",
        justificatif_url: null,
        qui_a_paye: userIdMap["parent2_user"],
        enregistre_par: userIdMap["admin_user"],
      },
      {
        etudiant_id: etudiantIdMap["etudiant3"],
        facture_ids: [factureIdByNumero["INV-2024-005"]],
        montantPaye: 20000,
        methode: "Espèces",
        mode: "Espèces",
        justificatif_url: null,
        qui_a_paye: etudiantIdMap["etudiant3"],
        enregistre_par: userIdMap["admin_user"],
      },
    ];

    for (const paiement of paiements) {
      await db.collection("paiements").add({
        ...paiement,
        status: "enregistré",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    console.log("✅ Paiements insérés");

    console.log("🎉 Seed Firestore terminé avec succès !");
  } catch (err) {
    console.error("❌ Erreur seed:", err);
    throw err;
  }
}

// Export the seeder function afin que seedRunner puisse l'exécuter
module.exports = { seedFirestore };
