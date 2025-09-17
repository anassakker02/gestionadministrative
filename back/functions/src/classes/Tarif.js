class Tarif {
  constructor(data) {
    this.id = data.id;
    this.classe_id = data.classe_id;
    this.montant = data.montant;
    this.annee_scolaire = data.annee_scolaire;
    this.nationalite = data.nationalite;
    this.bourse_id = data.bourse_id || null;
    this.reductions = Array.isArray(data.reductions) ? data.reductions : [];
    this.type = data.type || "Scolarité"; // New field for type of fee
    this.isActive = data.isActive === undefined ? true : data.isActive; // New field for active status
    this.endDate = data.endDate || null; // New field for end date of tariff
  }

  toJSON() {
    return {
      classe_id: this.classe_id,
      montant: this.montant,
      annee_scolaire: this.annee_scolaire,
      nationalite: this.nationalite,
      bourse_id: this.bourse_id,
      reductions: this.reductions,
      type: this.type,
      isActive: this.isActive,
      endDate: this.endDate,
    };
  }
}

module.exports = Tarif;
