class Tarif {
  constructor(data) {
    this.id = data.id;
    this.nom = data.nom;
    this.montant = data.montant;
    this.annee_scolaire = data.annee_scolaire;
    this.nationalite = data.nationalite;
    this.reductions = Array.isArray(data.reductions) ? data.reductions : [];
    this.type = data.type || "Scolarité"; // New field for type of fee
    this.isActive = data.isActive === undefined ? true : data.isActive; // New field for active status
    this.endDate = data.endDate || null; // New field for end date of tariff
  }

  toJSON() {
    return {
      nom: this.nom,
      montant: this.montant,
      annee_scolaire: this.annee_scolaire,
      nationalite: this.nationalite,
      reductions: this.reductions,
      type: this.type,
      isActive: this.isActive,
      endDate: this.endDate,
    };
  }
}

module.exports = Tarif;
