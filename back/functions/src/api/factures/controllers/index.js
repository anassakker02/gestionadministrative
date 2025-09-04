// const Facture = require('../../../classes/Facture'); // eslint-disable-line no-unused-vars
const db = require('../../../config/firebase');

class FactureController {
  constructor() {
    this.collection = db.collection('factures');
  }

  async create(req, res) {
    try {
      const {
        student_id,
        date_emission,
        montant_total,
        statut,
        numero_facture,
        pdf_url,
        description,
        echeances,
        remises
      } = req.body;

      if (!student_id || !montant_total || !statut) {
        return res.status(400).json({
          status: false,
          message: 'L\'étudiant, le montant total et le statut sont requis',
        });
      }

      if (typeof montant_total !== 'number' || montant_total <= 0) {
        return res.status(400).json({
          status: false,
          message: 'Le montant total doit être un nombre positif',
        });
      }

      // Création de la facture
      const newFacture = {
        student_id,
        date_emission: date_emission || new Date(),
        montant_total,
        statut,
        numero_facture,
        pdf_url,
        description,
        echeances,
        remises,
        createdAt: new Date(),
      };

      await db.collection('factures').add(newFacture);

      return res.status(200).json({ status: true, message: 'Facture créée avec succès' });
    } catch (error) {
      console.error('Error in create facture:', error);
      return res.status(500).json({ status: false, message: 'Erreur lors de la création de la facture' });
    }
  }
}

module.exports = new FactureController();

