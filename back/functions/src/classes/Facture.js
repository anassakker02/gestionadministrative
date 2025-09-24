class Facture {
  constructor(data) {
    this.id = data.id;
    this.student_id = data.student_id;
    this.date_emission = data.date_emission;
    this.montant_total = data.montant_total;

    // Champs calculés
    this.montant_du =
      data.montant_du !== undefined ? data.montant_du : data.montant_total;

    this.montant_payee =
      data.montant_payee !== undefined ? data.montant_payee : 0;

    this.montant_restant =
      data.montant_restant !== undefined
        ? data.montant_restant
        : data.montant_total - this.montant_payee;

    this.somme =
      data.somme !== undefined
        ? data.somme
        : Array.isArray(data.items)
        ? data.items.reduce(
            (acc, it) => acc + Number(it.total || it.montant || 0),
            0
          )
        : data.montant_total;

    // Infos factures
    this.statut = data.statut; // payée, impayée, partielle, annulée, avoir, rectificative
    this.numero_facture = data.numero_facture;
    this.pdf_url = data.pdf_url;
    this.logoUrl = data.logoUrl || null;
    this.legalMentions = data.legalMentions || null;
    this.termsAndConditions = data.termsAndConditions || null;
    this.items = Array.isArray(data.items) ? data.items : [];

    // Relations / métadonnées
    this.originalFactureId = data.originalFactureId || null;
    this.reason = data.reason || null;
    this.parentId = data.parentId || null;
    this.currency = data.currency || "MAD";
  }

  toJSON() {
    return {
      student_id: this.student_id,
      date_emission: this.date_emission,
      montant_total: this.montant_total,
      montant_du: this.montant_du,
      montant_payee: this.montant_payee,
      montant_restant: this.montant_restant,
      somme: this.somme,
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
    };
  }
}

module.exports = Facture;
