class Facture {
  constructor(data) {
    this.id = data.id;
    this.student_id = data.student_id;
    this.date_emission = data.date_emission;
    this.montant_total = data.montant_total;
    this.statut = data.statut; // payée, impayée, partielle, annulée, avoir, rectificative
    this.numero_facture = data.numero_facture;
    this.pdf_url = data.pdf_url;
    this.logoUrl = data.logoUrl || null;
    this.legalMentions = data.legalMentions || null;
    this.termsAndConditions = data.termsAndConditions || null;
    this.items = Array.isArray(data.items) ? data.items : [];
    this.originalFactureId = data.originalFactureId || null; // For avoir and rectificative invoices
    this.reason = data.reason || null; // For cancellations and credit notes
    this.parentId = data.parentId || null; // New field for linking to parent for family invoices
    this.currency = data.currency || "MAD"; // New field for currency
    this.montantPaye = data.montantPaye || 0; // New field: total amount paid for this invoice
    this.montantRestant = data.montantRestant || data.montant_total; // New field: remaining balance
  }

  toJSON() {
    return {
      student_id: this.student_id,
      date_emission: this.date_emission,
      montant_total: this.montant_total,
      statut: this.statut,
      numero_facture: this.numero_facture,
      pdf_url: this.pdf_url,
      logoUrl: this.logoUrl,
      legalMentions: this.legalMentions,
      termsAndConditions: this.termsAndConditions,
      items: this.items,
      originalFactureId: this.originalFactureId,
      reason: this.reason,
      parentId: this.parentId,
      currency: this.currency,
      montantPaye: this.montantPaye,
      montantRestant: this.montantRestant,
    };
  }
}

module.exports = Facture;