class Paiement {
  constructor(data) {
    this.id = data.id;
    this.facture_id = data.facture_id;
    this.facture_ids = Array.isArray(data.facture_ids) ? data.facture_ids : []; // New field for multiple invoice IDs
    this.date_paiement = data.date_paiement;
    this.montantPaye = data.montantPaye; // Renamed from 'montant'
    this.mode = data.mode; // espèces, chèque, virement, en ligne
    this.remboursement = data.remboursement || false;
    this.justificatif_url = data.justificatif_url || null; // New field for payment proof URL
    this.disputeStatus = data.disputeStatus || "none"; // New field: "none", "pending", "resolved", "rejected"
    this.disputeReason = data.disputeReason || null; // New field for dispute reason
    this.refundStatus = data.refundStatus || "none"; // New field: "none", "pending", "completed", "rejected"
    this.refundReason = data.refundReason || null; // New field for refund reason
  }

  toJSON() {
    return {
      facture_id: this.facture_id,
      facture_ids: this.facture_ids,
      date_paiement: this.date_paiement,
      montantPaye: this.montantPaye,
      mode: this.mode,
      remboursement: this.remboursement,
      justificatif_url: this.justificatif_url,
      disputeStatus: this.disputeStatus,
      disputeReason: this.disputeReason,
      refundStatus: this.refundStatus,
      refundReason: this.refundReason
    };
  }
}

module.exports = Paiement;