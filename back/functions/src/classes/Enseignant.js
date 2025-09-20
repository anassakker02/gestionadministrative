class Enseignant {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id; // Référence vers l'utilisateur dans la table users
    this.nom = data.nom;
    this.prenom = data.prenom;
    this.email = data.email;
    this.telephone = data.telephone;
    this.adresse = data.adresse;
    this.specialite = data.specialite || null;
    this.diplomes = data.diplomes || [];
    this.classes_assignees = data.classes_assignees || []; // IDs des classes
    this.matieres = data.matieres || []; // IDs des matières enseignées
    this.numero_enseignant = data.numero_enseignant || null;
    this.date_embauche = data.date_embauche || null;
    this.statut = data.statut || "actif"; // actif, inactif, congé
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Créer un enseignant à partir des données d'un utilisateur
  static fromUser(user, additionalData = {}) {
    return new Enseignant({
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
      specialite: this.specialite,
      diplomes: this.diplomes,
      classes_assignees: this.classes_assignees,
      matieres: this.matieres,
      numero_enseignant: this.numero_enseignant,
      date_embauche: this.date_embauche,
      statut: this.statut,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Enseignant;
