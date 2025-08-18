class Bourse {
    constructor(data) {
        this.id = data.id;
        this.nom = data.nom;
        this.pourcentage_remise = data.pourcentage_remise;
    }

    toJSON() {
        return {
        nom: this.nom,
        pourcentage_remise: this.pourcentage_remise
        };
    }
}

module.exports = Bourse;