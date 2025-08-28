const Echeancier = require("../../../classes/Echeancier");
const db = require("../../../config/firebase");

class EcheancierController {
  constructor() {
    this.collection = db.collection("echeanciers");
  }

  // Créer un échéancier
  async create(req, res) {
    try {
      const { etudiant_id, date_echeance, montant, statut } = req.body;
      if (!etudiant_id || !date_echeance || montant === undefined || !statut) {
        return res.status(400).json({
          status: false,
          message:
            "Les champs student_id, date_echeance, montant et statut sont requis",
        });
      }
      const echeancierData = {
        etudiant_id,
        date_echeance: new Date(date_echeance),
        montant: Number(montant),
        statut,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const docRef = await this.collection.add(echeancierData);
      const newEcheancier = await docRef.get();
      return res.status(201).json({
        status: true,
        message: "Échéancier créé avec succès",
        data: { id: newEcheancier.id, ...newEcheancier.data() },
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'échéancier:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur interne du serveur",
        error: error.message,
      });
    }
  }

  // Récupérer tous les échéanciers
  async getAll(req, res) {
    try {
      const snapshot = await this.collection.orderBy("createdAt", "desc").get();
      const echeanciers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return res.status(200).json({ status: true, data: echeanciers });
    } catch (error) {
      console.error("Erreur lors de la récupération des échéanciers:", error);
      return res
        .status(500)
        .json({
          status: false,
          message: "Erreur lors de la récupération des échéanciers",
          error: error.message,
        });
    }
  }

  // Récupérer un échéancier par ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ status: false, message: "ID de l'échéancier requis" });
      }
      const echeancierDoc = await this.collection.doc(id).get();
      if (!echeancierDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Échéancier non trouvé" });
      }
      const echeancierData = echeancierDoc.data();
      const echeancier = new Echeancier({
        id: echeancierDoc.id,
        ...echeancierData,
      });
      return res.status(200).json({ status: true, data: echeancier.toJSON() });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'échéancier:", error);
      return res
        .status(500)
        .json({
          status: false,
          message: "Erreur lors de la récupération de l'échéancier",
          error: error.message,
        });
    }
  }

  // Mettre à jour un échéancier
  async update(req, res) {
    try {
      const { id } = req.params;
      const { student_id, date_echeance, montant, statut } = req.body;
      if (!id) {
        return res
          .status(400)
          .json({ status: false, message: "ID de l'échéancier requis" });
      }
      const echeancierRef = this.collection.doc(id);
      const echeancierDoc = await echeancierRef.get();
      if (!echeancierDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Échéancier non trouvé" });
      }
      const updateData = { updatedAt: new Date() };
      if (student_id !== undefined) updateData.student_id = student_id;
      if (date_echeance !== undefined)
        updateData.date_echeance = new Date(date_echeance);
      if (montant !== undefined) updateData.montant = Number(montant);
      if (statut !== undefined) updateData.statut = statut;
      await echeancierRef.update(updateData);
      const updatedEcheancier = await echeancierRef.get();
      return res
        .status(200)
        .json({
          status: true,
          message: "Échéancier mis à jour avec succès",
          data: { id: updatedEcheancier.id, ...updatedEcheancier.data() },
        });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'échéancier:", error);
      return res
        .status(500)
        .json({
          status: false,
          message: "Erreur lors de la mise à jour de l'échéancier",
          error: error.message,
        });
    }
  }

  // Supprimer un échéancier
  async delete(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ status: false, message: "ID de l'échéancier requis" });
      }
      const echeancierRef = this.collection.doc(id);
      const echeancierDoc = await echeancierRef.get();
      if (!echeancierDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Échéancier non trouvé" });
      }
      await echeancierRef.delete();
      return res
        .status(200)
        .json({ status: true, message: "Échéancier supprimé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'échéancier:", error);
      return res
        .status(500)
        .json({
          status: false,
          message: "Erreur lors de la suppression de l'échéancier",
          error: error.message,
        });
    }
  }
}

module.exports = new EcheancierController();
