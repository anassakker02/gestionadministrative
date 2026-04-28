class Parent {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id; // Référence vers l'utilisateur dans la table users
    this.nom = data.nom;
    this.prenom = data.prenom;
    this.email = data.email;
    this.telephone = data.telephone;
    this.adresse = data.adresse;
    this.profession = data.profession || null;
    this.enfants_ids = data.enfants_ids || []; // IDs des étudiants enfants
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Créer un parent à partir des données d'un utilisateur
  static fromUser(user, additionalData = {}) {
    return new Parent({
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
      profession: this.profession,
      enfants_ids: this.enfants_ids,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Parent;
