const FraisPonctuel = require('../../../classes/FraisPonctuel');
const db = require('../../../config/firebase');
const AuditLog = require('../../../classes/AuditLog');

class FraisPonctuelController {
  constructor() {
    this.collection = db.collection('fraisPonctuels');
  }

  // Créer un frais ponctuel
  async create(req, res) {
    console.log("FraisPonctuelController: create method hit");
    try {
      const { facture_id, student_id, description, montant } = req.body;
      if (!description || montant === undefined) {
        return res.status(400).json({
          status: false,
          message: 'Les champs description et montant sont requis',
        });
      }
      if (!facture_id && !student_id) {
        return res.status(400).json({
          status: false,
          message: 'Au moins un des champs facture_id ou student_id est requis',
        });
      }

      const fraisPonctuelData = {
        facture_id: facture_id || null,
        student_id: student_id || null,
        description: description.trim(),
        montant: Number(montant),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const docRef = await this.collection.add(fraisPonctuelData);
      const newFraisPonctuel = await docRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'CREATE_FRAIS_PONCTUEL',
        entityType: 'FraisPonctuel',
        entityId: newFraisPonctuel.id,
        details: { newFraisPonctuelData: newFraisPonctuel.data() },
      });
      await auditLog.save();

      return res.status(201).json({
        status: true,
        message: 'Frais ponctuel créé avec succès',
        data: { id: newFraisPonctuel.id, ...newFraisPonctuel.data() },
      });
    } catch (error) {
      console.error('Erreur lors de la création du frais ponctuel:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur interne du serveur',
        error: error.message,
      });
    }
  }

  // Récupérer tous les frais ponctuels
  async getAll(req, res) {
    console.log("FraisPonctuelController: getAll method hit");
    try {
      const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
      const fraisPonctuels = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return res.status(200).json({ status: true, data: fraisPonctuels });
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des frais ponctuels:',
        error
      );
      return res
        .status(500)
        .json({
          status: false,
          message: 'Erreur lors de la récupération des frais ponctuels',
          error: error.message,
        });
    }
  }

  // Récupérer un frais ponctuel par ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ status: false, message: 'ID du frais ponctuel requis' });
      }
      const fraisPonctuelDoc = await this.collection.doc(id).get();
      if (!fraisPonctuelDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: 'Frais ponctuel non trouvé' });
      }
      const fraisPonctuelData = fraisPonctuelDoc.data();
      const fraisPonctuel = new FraisPonctuel({
        id: fraisPonctuelDoc.id,
        ...fraisPonctuelData,
      });
      return res
        .status(200)
        .json({ status: true, data: fraisPonctuel.toJSON() });
    } catch (error) {
      console.error('Erreur lors de la récupération du frais ponctuel:', error);
      return res
        .status(500)
        .json({
          status: false,
          message: 'Erreur lors de la récupération du frais ponctuel',
          error: error.message,
        });
    }
  }

  // Mettre à jour un frais ponctuel
  async update(req, res) {
    try {
      const { id } = req.params;
      const { facture_id, student_id, description, montant } = req.body;
      if (!id) {
        return res
          .status(400)
          .json({ status: false, message: 'ID du frais ponctuel requis' });
      }
      const fraisPonctuelRef = this.collection.doc(id);
      const fraisPonctuelDoc = await fraisPonctuelRef.get();
      if (!fraisPonctuelDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: 'Frais ponctuel non trouvé' });
      }

      const oldFraisPonctuelData = fraisPonctuelDoc.data(); // Get old data for audit log

      const updateData = { updatedAt: new Date() };
      if (facture_id !== undefined) updateData.facture_id = facture_id;
      if (student_id !== undefined) updateData.student_id = student_id;
      if (description !== undefined)
        updateData.description = description.trim();
      if (montant !== undefined) updateData.montant = Number(montant);
      await fraisPonctuelRef.update(updateData);
      const updatedFraisPonctuel = await fraisPonctuelRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'UPDATE_FRAIS_PONCTUEL',
        entityType: 'FraisPonctuel',
        entityId: id,
        details: { oldData: oldFraisPonctuelData, newData: updatedFraisPonctuel.data() },
      });
      await auditLog.save();

      return res
        .status(200)
        .json({
          status: true,
          message: 'Frais ponctuel mis à jour avec succès',
          data: { id: updatedFraisPonctuel.id, ...updatedFraisPonctuel.data() },
        });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du frais ponctuel:', error);
      return res
        .status(500)
        .json({
          status: false,
          message: 'Erreur lors de la mise à jour du frais ponctuel',
          error: error.message,
        });
    }
  }

  // Supprimer un frais ponctuel
  async delete(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ status: false, message: 'ID du frais ponctuel requis' });
      }
      const fraisPonctuelRef = this.collection.doc(id);
      const fraisPonctuelDoc = await fraisPonctuelRef.get();
      if (!fraisPonctuelDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: 'Frais ponctuel non trouvé' });
      }

      const deletedFraisPonctuelData = fraisPonctuelDoc.data(); // Get data before deletion for audit log

      await fraisPonctuelRef.delete();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'DELETE_FRAIS_PONCTUEL',
        entityType: 'FraisPonctuel',
        entityId: id,
        details: { deletedFraisPonctuelData },
      });
      await auditLog.save();

      return res
        .status(200)
        .json({ status: true, message: 'Frais ponctuel supprimé avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression du frais ponctuel:', error);
      return res
        .status(500)
        .json({
          status: false,
          message: 'Erreur lors de la suppression du frais ponctuel',
          error: error.message,
        });
    }
  }
}

module.exports = new FraisPonctuelController();
