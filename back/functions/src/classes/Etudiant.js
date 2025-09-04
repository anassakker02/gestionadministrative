class Etudiant {
  constructor(data) {
    this.id = data.id;
    this.nom = data.nom;
    this.prenom = data.prenom;
    this.date_naissance = data.date_naissance;
    this.classe_id = data.classe_id;
    this.nationalite = data.nationalite;
    this.bourse_id = data.bourse_id;
  }

  toJSON() {
    return {
      nom: this.nom,
      prenom: this.prenom,
      date_naissance: this.date_naissance,
      classe_id: this.classe_id,
      nationalite: this.nationalite,
      bourse_id: this.bourse_id
    };
  }
    
}

module.exports = Etudiant;