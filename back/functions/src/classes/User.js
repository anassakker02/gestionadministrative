const bcrypt = require('bcrypt');

class User {
  constructor(data) {
    this.id = data.id;
    this.nom = data.nom;
    this.prenom = data.prenom;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role; // admin, comptable, étudiant
    this.telephone = data.telephone;
    this.adresse = data.adresse;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async hashPassword() {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
      throw new Error('Erreur lors du hachage du mot de passe');
    }
  }

  async verifyPassword(inputPassword) {
    try {
      return await bcrypt.compare(inputPassword, this.password);
    } catch (error) {
      throw new Error('Erreur lors de la vérification du mot de passe');
    }
  }

  toJSON() {
    return {
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      role: this.role,
      telephone: this.telephone,
      adresse: this.adresse,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = User;
