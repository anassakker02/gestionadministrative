class Facture {
    constructor(data) {
        this.id = data.id;
        this.student_id = data.student_id;
        this.date_emission = data.date_emission;
        this.montant_total = data.montant_total;
        this.statut = data.statut; // payée, impayée, partielle
        this.numero_facture = data.numero_facture;
        this.pdf_url = data.pdf_url;
  }

  toJSON() {
    return {
      student_id: this.student_id,
      date_emission: this.date_emission,
      montant_total: this.montant_total,
      statut: this.statut,
      numero_facture: this.numero_facture,
      pdf_url: this.pdf_url
    };
  }
}

module.exports = Facture;