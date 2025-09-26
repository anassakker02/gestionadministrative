class Etudiant {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id; // Référence vers l'utilisateur dans la table users
    this.nom = data.nom;
    this.prenom = data.prenom;
    this.email = data.email || null; // Hérité de User
    this.telephone = data.telephone || null; // Hérité de User
    this.adresse = data.adresse || null; // Hérité de User
    this.date_naissance = data.date_naissance;
    this.classe_id = data.classe_id;
    this.nationalite = data.nationalite;
    this.bourse_id = data.bourse_id;
    this.exemptions = data.exemptions || []; // New field for exemptions
    this.parentId = data.parentId || null; // New field for linking to parent
    this.numero_etudiant = data.numero_etudiant || null; // Numéro d'étudiant unique
    this.frais_payment = data.frais_payment || 0; // Montant total des frais avec réduction de bourse
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Créer un étudiant à partir des données d'un utilisateur
  static async fromUser(user, additionalData = {}) {
    // Calculer automatiquement les frais de scolarité
    const fraisPayment = await Etudiant.calculateScolariteFees();
    
    return new Etudiant({
      user_id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      adresse: user.adresse,
      frais_payment: fraisPayment,
      ...additionalData,
    });
  }

  // Calculer les frais de scolarité automatiquement
  static async calculateScolariteFees() {
    try {
      const admin = require('firebase-admin');
      const db = admin.firestore();
      const { withRetryAndTimeout } = require('../utils/firestoreTimeout');
      
      // Récupérer l'année scolaire actuelle
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}-${currentYear + 1}`;
      
      console.log(`[Etudiant] Calcul des frais pour l'année: ${academicYear}`);
      
      // Récupérer les frais d'inscription avec timeout et retry
      const fraisInscriptionSnapshot = await withRetryAndTimeout(
        () => db
          .collection("tarifs")
          .where("annee_scolaire", "==", academicYear)
          .where("isActive", "==", true)
          .where("type", "==", "Scolarité")
          .where("nom", "==", "Frais Inscription")
          .get(),
        { timeoutMs: 8000, maxRetries: 2 }
      );

      // Récupérer les frais de scolarité avec timeout et retry
      const fraisScolariteSnapshot = await withRetryAndTimeout(
        () => db
          .collection("tarifs")
          .where("annee_scolaire", "==", academicYear)
          .where("isActive", "==", true)
          .where("type", "==", "Scolarité")
          .where("nom", "==", "Frais scolaire")
          .get(),
        { timeoutMs: 8000, maxRetries: 2 }
      );

      // Calculer le total
      let montantInscription = 0;
      let montantScolarite = 0;
      
      if (!fraisInscriptionSnapshot.empty) {
        montantInscription = fraisInscriptionSnapshot.docs[0].data().montant || 0;
        console.log(`[Etudiant] Frais d'inscription: ${montantInscription} MAD`);
      }
      
      if (!fraisScolariteSnapshot.empty) {
        montantScolarite = fraisScolariteSnapshot.docs[0].data().montant || 0;
        console.log(`[Etudiant] Frais de scolarité: ${montantScolarite} MAD`);
      }
      
      const totalFees = montantInscription + montantScolarite;
      console.log(`[Etudiant] Total frais_payment calculé: ${totalFees} MAD`);
      
      return totalFees;
    } catch (error) {
      console.error('[Etudiant] Erreur lors du calcul des frais:', error);
      return 0; // Retourner 0 en cas d'erreur
    }
  }

  toJSON() {
    return {
      user_id: this.user_id,
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      telephone: this.telephone,
      adresse: this.adresse,
      date_naissance: this.date_naissance || null,
      classe_id: this.classe_id,
      nationalite: this.nationalite,
      bourse_id: this.bourse_id,
      exemptions: this.exemptions,
      parentId: this.parentId,
      numero_etudiant: this.numero_etudiant,
      frais_payment: this.frais_payment,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Etudiant;
