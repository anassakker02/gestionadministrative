const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const db = require('../config/firebase');

const seedFirestore = async () => {
  console.log("Seeding Firestore with dummy data...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Users
  const usersData = [
    { email: 'admin@example.com', password: hashedPassword, nom: 'Admin', prenom: 'User', role: 'admin', isActive: true, telephone: '0600000001', adresse: '123 Admin St', emailNotifications: true, smsNotifications: true, createdAt: new Date() },
    { email: 'comptable@example.com', password: hashedPassword, nom: 'Comptable', prenom: 'User', role: 'comptable', isActive: true, telephone: '0600000002', adresse: '456 Accountant Rd', emailNotifications: true, smsNotifications: false, createdAt: new Date() },
    { email: 'etudiant@example.com', password: hashedPassword, nom: 'Etudiant', prenom: 'User', role: 'etudiant', isActive: true, telephone: '0600000003', adresse: '789 Student Ave', emailNotifications: false, smsNotifications: true, createdAt: new Date() },
    { email: 'family@example.com', password: hashedPassword, nom: 'Family', prenom: 'User', role: 'family', isActive: true, telephone: '0600000004', adresse: '101 Family Blvd', emailNotifications: true, smsNotifications: true, createdAt: new Date() },
    { email: 'guest@example.com', password: hashedPassword, nom: 'Guest', prenom: 'User', role: 'etudiant', isActive: false, telephone: '0600000005', adresse: '202 Guest Ln', emailNotifications: false, smsNotifications: false, createdAt: new Date() },
  ];
  for (const data of usersData) { await db.collection('users').add(data); }
  console.log("Users seeded.");

  // 2. Classes
  const classesData = [
    { nom: 'L1 Informatique', niveau: 'Licence 1', capacite: 30, description: 'Première année de licence en informatique', annee_scolaire: '2024-2025', createdAt: new Date() },
    { nom: 'M1 Cyber', niveau: 'Master 1', capacite: 25, description: 'Master 1 Cybersécurité', annee_scolaire: '2024-2025', createdAt: new Date() },
    { nom: 'L2 Design', niveau: 'Licence 2', capacite: 28, description: 'Deuxième année de licence en design', annee_scolaire: '2024-2025', createdAt: new Date() },
    { nom: 'M2 Marketing', niveau: 'Master 2', capacite: 20, description: 'Master 2 Marketing Digital', annee_scolaire: '2024-2025', createdAt: new Date() },
    { nom: 'L3 Biotech', niveau: 'Licence 3', capacite: 22, description: 'Troisième année de licence en Biotechnologie', annee_scolaire: '2024-2025', createdAt: new Date() },
  ];
  const classRefs = [];
  for (const data of classesData) { const ref = await db.collection('classes').add(data); classRefs.push(ref.id); }
  console.log("Classes seeded.");

  // 3. Parents
  const parentsData = [
    { nom: 'Dupont', prenom: 'Alice', email: 'alice.dupont@example.com', telephone: '0710000001', adresse: '12 Rue de la Famille', createdAt: new Date() },
    { nom: 'Martin', prenom: 'Bernard', email: 'bernard.martin@example.com', telephone: '0710000002', adresse: '24 Avenue des Parents', createdAt: new Date() },
    { nom: 'Lefevre', prenom: 'Sophie', email: 'sophie.lefevre@example.com', telephone: '0710000003', adresse: '36 Boulevard du Foyer', createdAt: new Date() },
    { nom: 'Dubois', prenom: 'Paul', email: 'paul.dubois@example.com', telephone: '0710000004', adresse: '48 Impasse des Enfants', createdAt: new Date() },
    { nom: 'Moreau', prenom: 'Laura', email: 'laura.moreau@example.com', telephone: '0710000005', adresse: '60 Chemin de l\'Éducation', createdAt: new Date() },
  ];
  const parentRefs = [];
  for (const data of parentsData) { const ref = await db.collection('parents').add(data); parentRefs.push(ref.id); }
  console.log("Parents seeded.");

  // 4. Bourses
  const boursesData = [
    { nom: 'Bourse Nationale', montant: 500, criteria: 'Nationalité Française', createdAt: new Date() },
    { nom: 'Bourse Excellence', montant: 1000, criteria: 'Mention Très Bien', createdAt: new Date() },
    { nom: 'Bourse Sociale', montant: 300, criteria: 'Revenus modestes', createdAt: new Date() },
    { nom: 'Bourse Sportive', montant: 700, criteria: 'Haut niveau sportif', createdAt: new Date() },
    { nom: 'Bourse Locale', montant: 200, criteria: 'Résident local', createdAt: new Date() },
  ];
  const bourseRefs = [];
  for (const data of boursesData) { const ref = await db.collection('bourses').add(data); bourseRefs.push(ref.id); }
  console.log("Bourses seeded.");

  // 5. Etudiants
  const studentsData = [
    { nom: 'Petit', prenom: 'Lucas', date_naissance: new Date('2003-05-15'), classe_id: classRefs[0], nationalite: 'Française', bourse_id: bourseRefs[0], parentId: parentRefs[0], exemptions: ['Frais de dossier'], anneeScolaire: '2024-2025', createdAt: new Date() },
    { nom: 'Durand', prenom: 'Chloé', date_naissance: new Date('2004-01-20'), classe_id: classRefs[1], nationalite: 'Belge', parentId: parentRefs[0], anneeScolaire: '2024-2025', createdAt: new Date() },
    { nom: 'Leroy', prenom: 'Manon', date_naissance: new Date('2002-11-01'), classe_id: classRefs[0], nationalite: 'Française', bourse_id: bourseRefs[1], parentId: parentRefs[1], anneeScolaire: '2024-2025', createdAt: new Date() },
    { nom: 'Roux', prenom: 'Noah', date_naissance: new Date('2003-08-22'), classe_id: classRefs[2], nationalite: 'Suisse', parentId: parentRefs[1], exemptions: ['Frais de transport'], anneeScolaire: '2024-2025', createdAt: new Date() },
    { nom: 'Fournier', prenom: 'Emma', date_naissance: new Date('2005-03-10'), classe_id: classRefs[3], nationalite: 'Française', parentId: parentRefs[2], anneeScolaire: '2024-2025', createdAt: new Date() },
  ];
  const studentRefs = [];
  for (const data of studentsData) { const ref = await db.collection('etudiants').add(data); studentRefs.push(ref.id); }
  console.log("Students seeded.");

  // 6. Tarifs
  const tarifsData = [
    { nom: 'Scolarité L1', montant: 5000, classe_id: classRefs[0], nationalite: 'Française', annee_scolaire: '2024-2025', type: 'Scolarité', isActive: true, createdAt: new Date() },
    { nom: 'Scolarité M1', montant: 7000, classe_id: classRefs[1], nationalite: 'Belge', annee_scolaire: '2024-2025', type: 'Scolarité', isActive: true, createdAt: new Date() },
    { nom: 'Scolarité L2 Int', montant: 6000, classe_id: classRefs[0], nationalite: 'Internationale', annee_scolaire: '2024-2025', type: 'Scolarité', isActive: true, createdAt: new Date() },
    { nom: 'Frais BDE', montant: 50, annee_scolaire: '2024-2025', type: 'Autres frais', isActive: true, createdAt: new Date() },
    { nom: 'Cantine Mensuelle', montant: 150, annee_scolaire: '2024-2025', type: 'Cantine', isActive: true, createdAt: new Date() },
  ];
  const tarifRefs = [];
  for (const data of tarifsData) { const ref = await db.collection('tarifs').add(data); tarifRefs.push(ref.id); }
  console.log("Tarifs seeded.");

  // 7. Factures
  const facturesData = [
    { student_id: studentRefs[0], date_emission: new Date(), montant_total: 5000, statut: 'impayée', numero_facture: 'INV-001', items: [{ description: 'Scolarité L1', quantity: 1, unitPrice: 5000, total: 5000 }], montantPaye: 0, montantRestant: 5000, currency: 'EUR', createdAt: new Date() },
    { student_id: studentRefs[1], date_emission: new Date(), montant_total: 7000, statut: 'partielle', numero_facture: 'INV-002', items: [{ description: 'Scolarité M1', quantity: 1, unitPrice: 7000, total: 7000 }], montantPaye: 3000, montantRestant: 4000, currency: 'EUR', createdAt: new Date() },
    { student_id: studentRefs[2], date_emission: new Date(), montant_total: 5000, statut: 'payée', numero_facture: 'INV-003', items: [{ description: 'Scolarité L1', quantity: 1, unitPrice: 5000, total: 5000 }], montantPaye: 5000, montantRestant: 0, currency: 'EUR', createdAt: new Date() },
    { student_id: studentRefs[3], date_emission: new Date(), montant_total: 6000, statut: 'impayée', numero_facture: 'INV-004', items: [{ description: 'Scolarité L2 Int', quantity: 1, unitPrice: 6000, total: 6000 }], montantPaye: 0, montantRestant: 6000, currency: 'EUR', createdAt: new Date() },
    { student_id: studentRefs[4], date_emission: new Date(), montant_total: 150, statut: 'payée', numero_facture: 'INV-005', items: [{ description: 'Cantine Mensuelle', quantity: 1, unitPrice: 150, total: 150 }], montantPaye: 150, montantRestant: 0, currency: 'EUR', createdAt: new Date() },
  ];
  const factureRefs = [];
  for (const data of facturesData) { const ref = await db.collection('factures').add(data); factureRefs.push(ref.id); }
  console.log("Factures seeded.");

  // 8. Paiements
  const paiementsData = [
    { facture_ids: [factureRefs[1]], date_paiement: new Date(), montantPaye: 3000, mode: 'Virement', justificatif_url: null, disputeStatus: 'none', refundStatus: 'none', createdAt: new Date() },
    { facture_ids: [factureRefs[2]], date_paiement: new Date(), montantPaye: 5000, mode: 'Carte Bancaire', justificatif_url: null, disputeStatus: 'none', refundStatus: 'none', createdAt: new Date() },
    { facture_ids: [factureRefs[4]], date_paiement: new Date(), montantPaye: 150, mode: 'Espèces', justificatif_url: null, disputeStatus: 'none', refundStatus: 'none', createdAt: new Date() },
    { facture_ids: [], date_paiement: new Date(), montantPaye: 1000, mode: 'Chèque', justificatif_url: null, disputeStatus: 'pending', refundStatus: 'none', createdAt: new Date() },
    { facture_ids: [], date_paiement: new Date(), montantPaye: 200, mode: 'Virement', justificatif_url: null, disputeStatus: 'none', refundStatus: 'completed', createdAt: new Date() },
  ];
  for (const data of paiementsData) { await db.collection('paiements').add(data); }
  console.log("Paiements seeded.");

  // 9. Frais Ponctuels
  const fraisPonctuelsData = [
    { nom: 'Frais d\'inscription tardive', montant: 50, student_id: studentRefs[0], createdAt: new Date() },
    { nom: 'Cotisation association', montant: 20, student_id: studentRefs[1], createdAt: new Date() },
    { nom: 'Voyage scolaire', montant: 200, student_id: studentRefs[2], createdAt: new Date() },
    { nom: 'Matériel pédagogique', montant: 30, student_id: studentRefs[3], createdAt: new Date() },
    { nom: 'Excursion', montant: 100, student_id: studentRefs[4], createdAt: new Date() },
  ];
  for (const data of fraisPonctuelsData) { await db.collection('fraisPonctuels').add(data); }
  console.log("Frais Ponctuels seeded.");

  // 10. Relances
  const relancesData = [
    { facture_id: factureRefs[0], dateEnvoi: new Date(), type: 'email', statutEnvoi: 'envoyée', efficacite: 'pending', createdAt: new Date() },
    { facture_id: factureRefs[1], dateEnvoi: new Date(), type: 'sms', statutEnvoi: 'envoyée', efficacite: 'paid_after_reminder', dateReponse: new Date(), createdAt: new Date() },
    { facture_id: factureRefs[3], dateEnvoi: new Date(), type: 'email', statutEnvoi: 'echec', efficacite: 'no_response', createdAt: new Date() },
    { facture_id: factureRefs[0], dateEnvoi: new Date(), type: 'sms', statutEnvoi: 'envoyée', efficacite: 'pending', createdAt: new Date() },
    { facture_id: factureRefs[1], dateEnvoi: new Date(), type: 'email', statutEnvoi: 'envoyée', efficacite: 'pending', createdAt: new Date() },
  ];
  for (const data of relancesData) { await db.collection('relances').add(data); }
  console.log("Relances seeded.");

  console.log("Firestore seeding complete!");
};

module.exports = { seedFirestore };
