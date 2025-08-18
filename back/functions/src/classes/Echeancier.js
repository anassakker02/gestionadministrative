class Echeancier {
  constructor(data) {
    this.id = data.id;
    this.student_id = data.student_id;
    this.date_echeance = data.date_echeance;
    this.montant = data.montant;
    this.statut = data.statut; // à payer, payé
  }

  toJSON() {
    return {
      student_id: this.student_id,
      date_echeance: this.date_echeance,
      montant: this.montant,
      statut: this.statut
    };
  }
}

module.exports = Echeancier;