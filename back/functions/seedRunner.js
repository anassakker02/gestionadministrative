/**
 * seedRunner.js
 * Exécuter avec: node seedRunner.js
 * Remplit la base de données Firestore RÉELLE avec les données de test.
 */

// ✅ Forcer la connexion à la vraie base de données (pas l'émulateur)
delete process.env.FIRESTORE_EMULATOR_HOST;
delete process.env.FIREBASE_FIRESTORE_EMULATOR_HOST;

const admin = require("firebase-admin");
const serviceAccount = require("./src/config/admin.json");
const bcrypt = require("bcrypt");

// Initialiser Firebase Admin directement ici (sans passer par firebase.js)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

async function seedFirestore() {
  console.log("🚀 Début du seed Firestore...");
  console.log("📌 Projet:", serviceAccount.project_id);
  console.log("📌 Emulateur actif?", process.env.FIRESTORE_EMULATOR_HOST || "NON (production)");

  const hashedPassword = await bcrypt.hash("password123", 10);
  console.log("✅ Mot de passe hashé");

  const currentYear = new Date().getFullYear();
  const academicYear = `${currentYear}-${currentYear + 1}`;

  // ─── Nettoyage ───────────────────────────────────────────────────────────────
  const collections = ["users", "etudiants", "bourses", "classes", "tarifs", "paiements"];
  console.log("\n⏳ Nettoyage des collections...");
  for (const col of collections) {
    const snapshot = await db.collection(col).get();
    if (snapshot.empty) {
      console.log(`   ✅ ${col}: déjà vide`);
      continue;
    }
    // Supprimer par lots de 400 (limite Firestore = 500)
    const docs = snapshot.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = db.batch();
      docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    console.log(`   ✅ ${col}: vidée (${docs.length} docs supprimés)`);
  }

  // ─── USERS ───────────────────────────────────────────────────────────────────
  console.log("\n⏳ Insertion des utilisateurs...");
  const users = [
    { id: "admin_user",             prenom: "Admin",    nom: "Système",    email: "admin@gmail.com",                  role: "admin",    isActive: true  },
    { id: "omar_benali_user",       prenom: "Omar",     nom: "Benali",     email: "omar.benali@example.com",          role: "etudiant", isActive: true  },
    { id: "fatima_zahra_user",      prenom: "Fatima",   nom: "Zahra",      email: "fatima.zahra@example.com",         role: "etudiant", isActive: true  },
    { id: "mohamed_mellouk_user",   prenom: "Mohamed",  nom: "Mellouk",    email: "mohamed.mellouk@example.com",      role: "etudiant", isActive: true  },
    { id: "ahmed_alami_user",       prenom: "Ahmed",    nom: "Alami",      email: "ahmed.alami@example.com",          role: "etudiant", isActive: true  },
    { id: "sara_benjelloun_user",   prenom: "Sara",     nom: "Benjelloun", email: "sara.benjelloun@example.com",      role: "etudiant", isActive: false },
    { id: "parent_benjelloun_user", prenom: "Hassan",   nom: "Benjelloun", email: "hassan.benjelloun@example.com",    role: "parent",   isActive: true,
      telephone: "+212 6 12 34 56 78", adresse: "123 Avenue Mohammed V, Casablanca", etudiant_id: "std-sara-benjelloun" },
  ];

  const userIdMap = {};
  for (const user of users) {
    await db.collection("users").doc(user.id).set({
      ...user,
      password: hashedPassword,
      status: user.isActive ? "active" : "inactive",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    userIdMap[user.id] = user.id;
    console.log(`   ✅ User: ${user.email}`);
  }

  // ─── BOURSES ─────────────────────────────────────────────────────────────────
  console.log("\n⏳ Insertion des bourses...");
  const bourses = [
    { id: "bourse_excellence", nom: "Bourse d'Excellence", description: "Bourse pour les étudiants avec d'excellents résultats", pourcentage_remise: 50, montant_remise: null, isExempt: false, isActive: true },
    { id: "bourse_sociale",    nom: "Bourse Sociale",      description: "Bourse pour les étudiants en situation difficile",      pourcentage_remise: null, montant_remise: 10000, isExempt: false, isActive: true },
    { id: "bourse_complete",   nom: "Bourse Complète",     description: "Exonération totale des frais",                          pourcentage_remise: null, montant_remise: null, isExempt: true, isActive: true },
  ];

  const bourseIdMap = {};
  for (const b of bourses) {
    const { id, ...data } = b;
    await db.collection("bourses").doc(id).set({ ...data, createdAt: new Date(), updatedAt: new Date() });
    bourseIdMap[id] = id;
    console.log(`   ✅ Bourse: ${b.nom}`);
  }

  // ─── CLASSES ─────────────────────────────────────────────────────────────────
  console.log("\n⏳ Insertion des classes...");
  const classes = [
    { id: "classe_6eme", nom: "6ème Année", niveau: "6ème", description: "Classe de 6ème année - Niveau débutant",     capacite_max: 30, annee_scolaire: academicYear, isActive: true },
    { id: "classe_5eme", nom: "5ème Année", niveau: "5ème", description: "Classe de 5ème année - Niveau intermédiaire", capacite_max: 30, annee_scolaire: academicYear, isActive: true },
    { id: "classe_4eme", nom: "4ème Année", niveau: "4ème", description: "Classe de 4ème année - Niveau avancé",        capacite_max: 30, annee_scolaire: academicYear, isActive: true },
    { id: "classe_3eme", nom: "3ème Année", niveau: "3ème", description: "Classe de 3ème année - Niveau expert",        capacite_max: 30, annee_scolaire: academicYear, isActive: true },
    { id: "classe_2nde", nom: "2nde Année", niveau: "2nde", description: "Classe de 2nde année - Niveau supérieur",     capacite_max: 30, annee_scolaire: academicYear, isActive: true },
  ];

  const classeIdMap = {};
  for (const c of classes) {
    const { id, ...data } = c;
    await db.collection("classes").doc(id).set({ ...data, createdAt: new Date(), updatedAt: new Date() });
    classeIdMap[id] = id;
    console.log(`   ✅ Classe: ${c.nom}`);
  }

  // ─── TARIFS ──────────────────────────────────────────────────────────────────
  console.log("\n⏳ Insertion des tarifs...");
  const tarifs = [
    { id: "tarif_frais_scolarite",   nom: "Frais scolaire",    type: "Scolarité", montant: 59590, annee_scolaire: academicYear, nationalite: "Marocain", isActive: true },
    { id: "tarif_frais_inscription", nom: "Frais Inscription", type: "Scolarité", montant: 800,   annee_scolaire: academicYear, nationalite: "Marocain", isActive: true },
  ];
  for (const t of tarifs) {
    await db.collection("tarifs").doc(t.id).set({ ...t, createdAt: new Date(), updatedAt: new Date() });
    console.log(`   ✅ Tarif: ${t.nom}`);
  }

  // ─── ETUDIANTS ───────────────────────────────────────────────────────────────
  console.log("\n⏳ Insertion des étudiants...");
  const etudiants = [
    { id: "std-omar-benali",    user_id: "omar_benali_user",     nom: "Benali",    prenom: "Omar",    email: "omar.benali@example.com",     telephone: "+212610000001", adresse: "123 Rue de la Paix, Casablanca",       date_naissance: new Date("2005-09-15"), nationalite: "Marocaine", code_massar: "2024001", classe_id: "classe_6eme", bourse_id: "bourse_excellence", frais_payment: 30195 },
    { id: "std-fatima-zahra",   user_id: "fatima_zahra_user",    nom: "Zahra",     prenom: "Fatima",  email: "fatima.zahra@example.com",    telephone: "+212610000002", adresse: "456 Avenue Royale, Rabat",             date_naissance: new Date("2004-03-20"), nationalite: "Marocaine", code_massar: "2024002", classe_id: "classe_5eme", bourse_id: "bourse_sociale",    frais_payment: 50390 },
    { id: "std-mohamed-mellouk",user_id: "mohamed_mellouk_user", nom: "Mellouk",   prenom: "Mohamed", email: "mohamed.mellouk@example.com", telephone: "+212610000004", adresse: "101 Avenue Mohammed V, Marrakech",     date_naissance: new Date("2005-07-22"), nationalite: "Marocaine", code_massar: "2024004", classe_id: "classe_4eme", bourse_id: "bourse_complete",   frais_payment: 0     },
    { id: "std-ahmed-alami",    user_id: "ahmed_alami_user",     nom: "Alami",     prenom: "Ahmed",   email: "ahmed.alami@example.com",     telephone: "+212610000005", adresse: "789 Boulevard Zerktouni, Casablanca",  date_naissance: new Date("2004-11-10"), nationalite: "Marocaine", code_massar: "2024005", classe_id: "classe_6eme", bourse_id: null,             frais_payment: 60390 },
    { id: "std-sara-benjelloun",user_id: "sara_benjelloun_user", nom: "Benjelloun",prenom: "Sara",    email: "sara.benjelloun@example.com", telephone: "+212610000006", adresse: "321 Rue Hassan II, Fès",               date_naissance: new Date("2003-05-18"), nationalite: "Marocaine", code_massar: "2024006", classe_id: "classe_5eme", bourse_id: "bourse_sociale",    frais_payment: 50390 },
  ];
  for (const e of etudiants) {
    await db.collection("etudiants").doc(e.id).set({ ...e, createdAt: new Date(), updatedAt: new Date() });
    console.log(`   ✅ Etudiant: ${e.prenom} ${e.nom}`);
  }

  // ─── PAIEMENTS ───────────────────────────────────────────────────────────────
  console.log("\n⏳ Insertion des paiements...");
  const paiements = [
    { id: "paiement-ahmed-1", etudiant_id: "std-ahmed-alami",    student_id: "std-ahmed-alami",    montantPaye: 30000, methode: "Virement bancaire", numeroReference: "VIR-2024-001", notes: "Premier paiement - Frais d'inscription",          status: "valide", date: new Date("2024-09-15"), createdAt: new Date(), updatedAt: new Date() },
    { id: "paiement-ahmed-2", etudiant_id: "std-ahmed-alami",    student_id: "std-ahmed-alami",    montantPaye: 15000, methode: "Espèces",           numeroReference: "ESP-2024-002", notes: "Deuxième paiement - Frais de scolarité partiel", status: "valide", date: new Date("2024-10-20"), createdAt: new Date(), updatedAt: new Date() },
    { id: "paiement-sara-1",  etudiant_id: "std-sara-benjelloun",student_id: "std-sara-benjelloun",montantPaye: 25000, methode: "Chèque",             numeroReference: "CHQ-2024-003", notes: "Paiement initial avant suspension",               status: "valide", date: new Date("2024-09-10"), createdAt: new Date(), updatedAt: new Date() },
    { id: "paiement-sara-2",  etudiant_id: "std-sara-benjelloun",student_id: "std-sara-benjelloun",montantPaye: 10000, methode: "Virement bancaire", numeroReference: "VIR-2024-004", notes: "Paiement partiel avant suspension du compte",     status: "valide", date: new Date("2024-10-05"), createdAt: new Date(), updatedAt: new Date() },
  ];
  for (const p of paiements) {
    await db.collection("paiements").doc(p.id).set(p);
    console.log(`   ✅ Paiement: ${p.id}`);
  }

  console.log("\n🎉 Seed Firestore terminé avec succès !");
  console.log("📊 Résumé:");
  console.log("   - 7 utilisateurs (1 admin + 5 étudiants + 1 parent)");
  console.log("   - 3 bourses");
  console.log("   - 5 classes");
  console.log("   - 2 tarifs");
  console.log("   - 5 étudiants");
  console.log("   - 4 paiements");
}

seedFirestore()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Erreur lors du seed:", err.message);
    process.exit(1);
  });
