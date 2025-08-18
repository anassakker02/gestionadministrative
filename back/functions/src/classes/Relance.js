class Relance {
  constructor(data) {
    this.id = data.id;
    this.facture_id = data.facture_id;
    this.date_envoi = data.date_envoi;
    this.type = data.type; // email, SMS
    this.statut = data.statut; // envoyée, en attente
  }

  toJSON() {
    return {
      facture_id: this.facture_id,
      date_envoi: this.date_envoi,
      type: this.type,
      statut: this.statut
    };
  }
}

module.exports = Relance;