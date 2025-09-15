// const Facture = require('../../../classes/Facture'); // eslint-disable-line no-unused-vars
const db = require("../../../config/firebase");

class FactureController {
  constructor() {
    this.collection = db.collection("factures");
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
        remises,
      } = req.body;

      if (!student_id || !montant_total || !statut) {
        return res.status(400).json({
          status: false,
          message: "L'étudiant, le montant total et le statut sont requis",
        });
      }

      if (typeof montant_total !== "number" || montant_total <= 0) {
        return res.status(400).json({
          status: false,
          message: "Le montant total doit être un nombre positif",
        });
      }

      // Création de la facture (sans undefined)
      const newFacture = {
        student_id,
        date_emission: date_emission || new Date(),
        montant_total,
        statut,
        createdAt: new Date(),
      };
      if (typeof numero_facture !== "undefined")
        newFacture.numero_facture = numero_facture;
      if (typeof pdf_url !== "undefined") newFacture.pdf_url = pdf_url;
      if (typeof description !== "undefined")
        newFacture.description = description;
      if (typeof echeances !== "undefined") newFacture.echeances = echeances;
      if (typeof remises !== "undefined") newFacture.remises = remises;

      await db.collection("factures").add(newFacture);

      return res
        .status(200)
        .json({ status: true, message: "Facture créée avec succès" });
    } catch (error) {
      console.error("Error in create facture:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la création de la facture",
      });
    }
  }

  async getAll(req, res) {
    try {
      // Si etudiant_id présent, déléguer à getByStudent
      if (req.query.etudiant_id) {
        req.params.student_id = req.query.etudiant_id;
        return this.getByStudent(req, res);
      }
      const snapshot = await this.collection.get();
      const factures = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return res.status(200).json({ status: true, data: factures });
    } catch (error) {
      return res.status(500).json({ status: false, message: "Erreur serveur" });
    }
  }

  async search(req, res) {
    return res.status(501).json({ status: false, message: "Not Implemented" });
  }

  async getStats(req, res) {
    return res.status(501).json({ status: false, message: "Not Implemented" });
  }

  async getByStudent(req, res) {
    try {
      const { student_id } = req.params;
      const { status } = req.query;
      if (!student_id) {
        return res
          .status(400)
          .json({ status: false, message: "student_id requis" });
      }
      let query = this.collection.where("student_id", "==", student_id);
      if (status) {
        query = query.where("statut", "==", status);
      }
      const snapshot = await query.get();
      const factures = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return res.status(200).json({ status: true, data: factures });
    } catch (error) {
      console.error("Erreur getByStudent:", error);
      return res.status(500).json({ status: false, message: "Erreur serveur" });
    }
  }

  async getByStatus(req, res) {
    return res.status(501).json({ status: false, message: "Not Implemented" });
  }

  async getById(req, res) {
    return res.status(501).json({ status: false, message: "Not Implemented" });
  }

  async update(req, res) {
    return res.status(501).json({ status: false, message: "Not Implemented" });
  }

  async delete(req, res) {
    return res.status(501).json({ status: false, message: "Not Implemented" });
  }
}

module.exports = new FactureController();
