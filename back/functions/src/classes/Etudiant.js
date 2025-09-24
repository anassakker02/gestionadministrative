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
  static fromUser(user, additionalData = {}) {
    return new Etudiant({
      user_id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      adresse: user.adresse,
      ...additionalData,
    });
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
