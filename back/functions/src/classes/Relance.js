class Relance {
  constructor(data) {
    this.id = data.id;
    this.facture_id = data.facture_id;
    this.dateEnvoi = data.dateEnvoi; // Renamed from date_envoi
    this.type = data.type; // email, SMS
    this.statutEnvoi = data.statutEnvoi || "en attente"; // Renamed from statut
    this.efficacite = data.efficacite || "pending"; // New field: "pending", "paid_after_reminder", "no_response", "cancelled"
    this.dateReponse = data.dateReponse || null; // New field for response date
  }

  toJSON() {
    return {
      facture_id: this.facture_id,
      dateEnvoi: this.dateEnvoi,
      type: this.type,
      statutEnvoi: this.statutEnvoi,
      efficacite: this.efficacite,
      dateReponse: this.dateReponse
    };
  }
}

module.exports = Relance;