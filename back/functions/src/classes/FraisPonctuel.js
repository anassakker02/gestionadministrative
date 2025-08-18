class FraisPonctuel {
  constructor(data) {
    this.id = data.id;
    this.facture_id = data.facture_id;
    this.description = data.description;
    this.montant = data.montant;
  }

  toJSON() {
    return {
      facture_id: this.facture_id,
      description: this.description,
      montant: this.montant
    };
  }
}

module.exports = FraisPonctuel;