const Relance = require('../../../classes/Relance');
const db = require('../../../config/firebase');

class RelanceController {
  constructor() {
    this.collection = db.collection('relances');
  }

  // Créer une relance
  async create(req, res) {
    try {
      const { facture_id, date_envoi, type, statut } = req.body;

      if (!facture_id || !date_envoi || !type) {
        return res.status(400).json({
          status: false,
          message: 'Les champs facture_id, date_envoi et type sont requis',
        });
      }

      const relanceData = {
        facture_id,
        date_envoi: new Date(date_envoi),
        type: type.trim(),
        statut: statut || 'en attente',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await this.collection.add(relanceData);
      const newRelance = await docRef.get();

      return res.status(201).json({
        status: true,
        message: 'Relance créée avec succès',
        data: { id: newRelance.id, ...newRelance.data() },
      });
    } catch (error) {
      console.error('Erreur lors de la création de la relance:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur interne du serveur',
        error: error.message,
      });
    }
  }

  // Récupérer toutes les relances
  async getAll(req, res) {
    try {
      const snapshot = await this.collection.orderBy('createdAt', 'desc').get();
      const relances = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return res.status(200).json({ status: true, data: relances });
    } catch (error) {
      console.error('Erreur lors de la récupération des relances:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la récupération des relances',
        error: error.message,
      });
    }
  }

  // Récupérer une relance par ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      if (!id)
        return res
          .status(400)
          .json({ status: false, message: 'ID de la relance requis' });

      const relanceDoc = await this.collection.doc(id).get();
      if (!relanceDoc.exists)
        return res
          .status(404)
          .json({ status: false, message: 'Relance non trouvée' });

      const relanceData = relanceDoc.data();
      const relance = new Relance({ id: relanceDoc.id, ...relanceData });

      return res.status(200).json({ status: true, data: relance.toJSON() });
    } catch (error) {
      console.error('Erreur lors de la récupération de la relance:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la récupération de la relance',
        error: error.message,
      });
    }
  }

  // Mettre à jour une relance
  async update(req, res) {
    try {
      const { id } = req.params;
      const { facture_id, date_envoi, type, statut } = req.body;

      if (!id)
        return res
          .status(400)
          .json({ status: false, message: 'ID de la relance requis' });

      const relanceRef = this.collection.doc(id);
      const relanceDoc = await relanceRef.get();
      if (!relanceDoc.exists)
        return res
          .status(404)
          .json({ status: false, message: 'Relance non trouvée' });

      const updateData = { updatedAt: new Date() };
      if (facture_id !== undefined) updateData.facture_id = facture_id;
      if (date_envoi !== undefined) updateData.date_envoi = new Date(date_envoi);
      if (type !== undefined) updateData.type = type.trim();
      if (statut !== undefined) updateData.statut = statut;

      await relanceRef.update(updateData);
      const updatedRelance = await relanceRef.get();

      return res.status(200).json({
        status: true,
        message: 'Relance mise à jour avec succès',
        data: { id: updatedRelance.id, ...updatedRelance.data() },
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la relance:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la mise à jour de la relance',
        error: error.message,
      });
    }
  }

  // Supprimer une relance
  async delete(req, res) {
    try {
      const { id } = req.params;
      if (!id)
        return res
          .status(400)
          .json({ status: false, message: 'ID de la relance requis' });

      const relanceRef = this.collection.doc(id);
      const relanceDoc = await relanceRef.get();
      if (!relanceDoc.exists)
        return res
          .status(404)
          .json({ status: false, message: 'Relance non trouvée' });

      await relanceRef.delete();
      return res
        .status(200)
        .json({ status: true, message: 'Relance supprimée avec succès' });
    } catch (error) {
      console.error('Erreur lors de la suppression de la relance:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la suppression de la relance',
        error: error.message,
      });
    }
  }
}

module.exports = new RelanceController();
