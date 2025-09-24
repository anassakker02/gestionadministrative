class Relance {
  constructor(data) {
    this.id = data.id;
    this.facture_id = data.facture_id;
    this.dateEnvoi = data.dateEnvoi; // Renamed from date_envoi
    this.type = data.type; // email, SMS
    this.statutEnvoi = data.statutEnvoi || "en attente"; // Renamed from statut
    this.efficacite = data.efficacite || "pending"; // New field: "pending", "paid_after_reminder", "no_response", "cancelled"
    this.dateReponse = data.dateReponse || null; // New field for response date
    this.messageContent = data.messageContent || null; // New field for message content
    this.periodeCible = data.periodeCible || null; // New field for target period
    this.montantPeriodeDu = data.montantPeriodeDu || null; // New field for amount due for the period
  }

  toJSON() {
    return {
      facture_id: this.facture_id,
      dateEnvoi: this.dateEnvoi,
      type: this.type,
      statutEnvoi: this.statutEnvoi,
      efficacite: this.efficacite,
      dateReponse: this.dateReponse,
      messageContent: this.messageContent, // Include message content in JSON output
      periodeCible: this.periodeCible, // Include target period in JSON output
      montantPeriodeDu: this.montantPeriodeDu, // Include amount due for the period in JSON output
    };
  }
}

module.exports = Relance;