class Tarif {
  constructor(data) {
    this.id = data.id;
    this.classe_id = data.classe_id;
    this.montant = data.montant;
    this.annee_scolaire = data.annee_scolaire;
    this.nationalite = data.nationalite;
    this.bourse_id = data.bourse_id || null;
  }

  toJSON() {
    return {
      classe_id: this.classe_id,
      montant: this.montant,
      annee_scolaire: this.annee_scolaire,
      nationalite: this.nationalite,
      bourse_id: this.bourse_id
    };
  }
}

module.exports = Tarif;