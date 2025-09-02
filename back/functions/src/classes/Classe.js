class Classe {
  constructor(data) {
    this.id = data.id;
    this.nom = data.nom;
    this.niveau = data.niveau;
  }

  toJSON() {
    return {
      nom: this.nom,
      niveau: this.niveau
    };
  }
    
}

module.exports = Classe;