/**
 * Script utilitaire pour générer une facture pour l'étudiant 'Etudiant Premier'.
 * Usage (depuis back/functions):
 *   node src/scripts/generateInvoiceForFirstStudent.js
 */
const admin = require("firebase-admin");
const path = require("path");

// charger l'initialisation firebase existante si présente
try {
  // si vous avez un fichier d'initialisation commun, requirez-le ici
  require(path.resolve(__dirname, "..", "..", "..", "initFirebase.js"));
} catch (e) {
  // fallback: initialiser si nécessaire
  if (!admin.apps.length) {
    admin.initializeApp();
  }
}

const db = admin.firestore();

async function findStudent() {
  // Cherche dans etudiants d'abord
  const etuSnap = await db
    .collection("etudiants")
    .where("prenom", "==", "Etudiant")
    .where("nom", "==", "Premier")
    .limit(1)
    .get();
  if (!etuSnap.empty)
    return {
      id: etuSnap.docs[0].id,
      data: etuSnap.docs[0].data(),
      from: "etudiants",
    };

  // Fallback: cherche dans users
  const userSnap = await db
    .collection("users")
    .where("prenom", "==", "Etudiant")
    .where("nom", "==", "Premier")
    .limit(1)
    .get();
  if (!userSnap.empty)
    return {
      id: userSnap.docs[0].id,
      data: userSnap.docs[0].data(),
      from: "users",
    };

  return null;
}

async function createInvoiceFor(student) {
  const student_id = student.id;
  const studentData = student.data || {};

  // Calcule un montant simple de test (utilisez tarif si dispo)
  let montant_total = 55000; // valeur demandée pour le test
  const numero = `SEED-GEN-${student_id.slice(0, 6)}-${Date.now()
    .toString()
    .slice(-4)}`;

  const facture = {
    etudiant_id: student_id,
    student_id,
    parent_id: studentData.parentId || studentData.parent_id || null,
    date_emission: new Date(),
    montant_total,
    montantPaye: 0,
    montantRestant: montant_total,
    statut: "impayée",
    numero,
    numero_facture: numero,
    items: [
      {
        description: "Frais scolarité (généré script)",
        quantity: 1,
        unitPrice: montant_total,
        total: montant_total,
      },
    ],
    currency: "MAD",
    anneeScolaire: new Date().getFullYear().toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const ref = await db.collection("factures").add(facture);
  const created = await ref.get();
  console.log("Facture créée id=", ref.id, created.data());
}

async function main() {
  try {
    const s = await findStudent();
    if (!s) {
      console.error(
        "Étudiant 'Etudiant Premier' non trouvé dans 'etudiants' ou 'users'."
      );
      process.exit(1);
    }
    console.log("Student found in", s.from, s.id);
    await createInvoiceFor(s);
    console.log("Terminé");
    process.exit(0);
  } catch (err) {
    console.error("Erreur:", err);
    process.exit(2);
  }
}

if (require.main === module) main();
