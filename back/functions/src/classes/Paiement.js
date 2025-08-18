class Paiement {
  constructor(data) {
    this.id = data.id;
    this.facture_id = data.facture_id;
    this.date_paiement = data.date_paiement;
    this.montant = data.montant;
    this.mode = data.mode; // espèces, chèque, virement, en ligne
    this.remboursement = data.remboursement || false;
  }

  toJSON() {
    return {
      facture_id: this.facture_id,
      date_paiement: this.date_paiement,
      montant: this.montant,
      mode: this.mode,
      remboursement: this.remboursement
    };
  }
}

module.exports = Paiement;