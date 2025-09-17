class FraisPonctuel {
  constructor(data) {
    this.id = data.id;
    this.student_id = data.student_id; // New field for student ID
    this.facture_id = data.facture_id;
    this.description = data.description;
    this.montant = data.montant;
  }

  toJSON() {
    return {
      student_id: this.student_id,
      facture_id: this.facture_id,
      description: this.description,
      montant: this.montant
    };
  }
}

module.exports = FraisPonctuel;