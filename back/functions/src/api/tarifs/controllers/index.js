const Tarif = require("../../../classes/Tarif");
const db = require("../../../config/firebase");
const AuditLog = require("../../../classes/AuditLog");

class TarifController {
  constructor() {
    this.collection = db.collection("tarifs");
  }

  /**
   * Créer un nouveau tarif
   * POST /tarifs
   */
  async create(req, res) {
    try {
      const { classe_id, montant, annee_scolaire, nationalite, bourse_id, reductions, type } = req.body;

      // Validation des données obligatoires
      if (!classe_id || montant === undefined || !annee_scolaire || !nationalite || !type) {
        return res.status(400).json({
          status: false,
          message: "Classe, montant, année scolaire, nationalité et type sont requis",
        });
      }

      if (typeof montant !== "number" || montant < 0) {
        return res.status(400).json({
          status: false,
          message: "Le montant doit être un nombre positif",
        });
      }

      // Check if an active tariff with the same criteria exists
      let existingTarifQuery = this.collection
        .where("classe_id", "==", classe_id)
        .where("annee_scolaire", "==", annee_scolaire)
        .where("nationalite", "==", nationalite)
        .where("type", "==", type)
        .where("isActive", "==", true);

      if (bourse_id) {
        existingTarifQuery = existingTarifQuery.where("bourse_id", "==", bourse_id);
      } else {
        existingTarifQuery = existingTarifQuery.where("bourse_id", "==", null);
      }

      const existingTarifSnapshot = await existingTarifQuery.get();

      if (!existingTarifSnapshot.empty) {
        // Deactivate the old tariff
        const oldTarifDoc = existingTarifSnapshot.docs[0];
        const oldTarifRef = this.collection.doc(oldTarifDoc.id);
        const oldTarifData = oldTarifDoc.data();

        await oldTarifRef.update({
          isActive: false,
          endDate: new Date(),
          updatedAt: new Date(),
        });

        // Audit log for old tariff deactivation
        const deactivateAuditLog = new AuditLog({
          userId: req.user?.id || 'system',
          action: 'DEACTIVATE_TARIF',
          entityType: 'Tarif',
          entityId: oldTarifDoc.id,
          details: { oldData: oldTarifData, newData: { ...oldTarifData, isActive: false, endDate: new Date() } },
        });
        await deactivateAuditLog.save();
      }

      // Create the new tariff
      const tarifData = {
        classe_id,
        montant: Number(montant),
        annee_scolaire,
        nationalite,
        bourse_id: bourse_id || null,
        reductions: Array.isArray(reductions) ? reductions : [],
        type,
        isActive: true,
        endDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await this.collection.add(tarifData);
      const newTarif = await docRef.get();

      // Audit log for new tariff creation
      const createAuditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'CREATE_TARIF',
        entityType: 'Tarif',
        entityId: newTarif.id,
        details: { newTarifData: newTarif.data() },
      });
      await createAuditLog.save();

      return res.status(201).json({
        status: true,
        message: "Tarif créé avec succès",
        data: {
          id: newTarif.id,
          ...newTarif.data(),
        },
      });
    } catch (error) {
      console.error("Erreur lors de la création du tarif:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur interne du serveur",
        error: error.message,
      });
    }
  }

  /**
   * Récupérer tous les tarifs
   * GET /tarifs
   */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);

      let query = this.collection.where("isActive", "==", true).orderBy("createdAt", "desc"); // Only get active tariffs by default

      // Recherche par nom si le paramètre search est fourni
      if (search && search.trim()) {
        // This search will need to be refined if 'nom' is no longer a unique identifier.
        // For now, keeping it as is, but noting it for future improvements.
        query = query
          .where("nom", ">=", search.trim())
          .where("nom", "<=", search.trim() + "\uf8ff");
      }

      // Pagination
      const offset = (pageNumber - 1) * limitNumber;
      const snapshot = await query.limit(limitNumber).offset(offset).get();

      const tarifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Compter le total des documents pour la pagination
      const totalSnapshot = await this.collection.where("isActive", "==", true).get();
      const total = totalSnapshot.size;

      return res.status(200).json({
        status: true,
        data: tarifs,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(total / limitNumber),
        },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des tarifs:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la récupération des tarifs",
        error: error.message,
      });
    }
  }

  /**
   * Récupérer un tarif par ID
   * GET /tarifs/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: "ID du tarif requis",
        });
      }

      const tarifDoc = await this.collection.doc(id).get();

      if (!tarifDoc.exists) {
        return res.status(404).json({
          status: false,
          message: "Tarif non trouvé",
        });
      }

      const tarifData = tarifDoc.data();
      const tarif = new Tarif({
        id: tarifDoc.id,
        ...tarifData,
      });

      return res.status(200).json({
        status: true,
        data: tarif.toJSON(),
      });
    } catch (error) {
      console.error("Erreur lors de la récupération du tarif:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la récupération du tarif",
        error: error.message,
      });
    }
  }

  /**
   * Mettre à jour un tarif
   * PUT /tarifs/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { classe_id, montant, annee_scolaire, nationalite, bourse_id, reductions, type } = req.body;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: "ID du tarif requis",
        });
      }

      // Vérifier si le tarif existe et est actif
      const tarifRef = this.collection.doc(id);
      const tarifDoc = await tarifRef.get();

      if (!tarifDoc.exists || !tarifDoc.data().isActive) {
        return res.status(404).json({
          status: false,
          message: "Tarif non trouvé ou inactif",
        });
      }

      const oldTarifData = tarifDoc.data();

      // Deactivate the old tariff (soft delete)
      await tarifRef.update({
        isActive: false,
        endDate: new Date(),
        updatedAt: new Date(),
      });

      // Audit log for old tariff deactivation
      const deactivateAuditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'DEACTIVATE_OLD_TARIF_ON_UPDATE',
        entityType: 'Tarif',
        entityId: id,
        details: { oldData: oldTarifData, newData: { ...oldTarifData, isActive: false, endDate: new Date() } },
      });
      await deactivateAuditLog.save();

      // Create a new tariff with updated details
      const newTarifData = {
        classe_id: classe_id !== undefined ? classe_id : oldTarifData.classe_id,
        montant: montant !== undefined ? Number(montant) : oldTarifData.montant,
        annee_scolaire: annee_scolaire !== undefined ? annee_scolaire : oldTarifData.annee_scolaire,
        nationalite: nationalite !== undefined ? nationalite : oldTarifData.nationalite,
        bourse_id: bourse_id !== undefined ? (bourse_id || null) : (oldTarifData.bourse_id || null),
        reductions: reductions !== undefined ? (Array.isArray(reductions) ? reductions : []) : oldTarifData.reductions,
        type: type !== undefined ? type : oldTarifData.type,
        isActive: true,
        endDate: null,
        createdAt: new Date(), // New creation date for the new tariff
        updatedAt: new Date(),
      };

      const docRef = await this.collection.add(newTarifData);
      const updatedTarif = await docRef.get();

      // Audit log for new tariff creation
      const createNewAuditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'CREATE_NEW_TARIF_ON_UPDATE',
        entityType: 'Tarif',
        entityId: updatedTarif.id,
        details: { newTarifData: updatedTarif.data() },
      });
      await createNewAuditLog.save();

      return res.status(200).json({
        status: true,
        message: "Tarif mis à jour avec succès (nouvelle version créée)",
        data: {
          id: updatedTarif.id,
          ...updatedTarif.data(),
        },
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du tarif:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la mise à jour du tarif",
        error: error.message,
      });
    }
  }

  /**
   * Supprimer un tarif
   * DELETE /tarifs/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: "ID du tarif requis",
        });
      }

      // Vérifier si le tarif existe et est actif
      const tarifRef = this.collection.doc(id);
      const tarifDoc = await tarifRef.get();

      if (!tarifDoc.exists || !tarifDoc.data().isActive) {
        return res.status(404).json({
          status: false,
          message: "Tarif non trouvé ou déjà inactif",
        });
      }

      const deletedTarifData = tarifDoc.data(); // Get data before soft deletion

      // Perform soft delete
      await tarifRef.update({
        isActive: false,
        endDate: new Date(),
        updatedAt: new Date(),
      });

      // Audit log for soft deletion
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'SOFT_DELETE_TARIF',
        entityType: 'Tarif',
        entityId: id,
        details: { oldData: deletedTarifData, newData: { ...deletedTarifData, isActive: false, endDate: new Date() } },
      });
      await auditLog.save();

      return res.status(200).json({
        status: true,
        message: "Tarif supprimé (désactivé) avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression du tarif:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la suppression du tarif",
        error: error.message,
      });
    }
  }

  /**
   * Rechercher des tarifs par nom
   * GET /tarifs/search?q=terme
   */
  async search(req, res) {
    try {
      const { q } = req.query;

      if (!q || q.trim() === "") {
        return res.status(400).json({
          status: false,
          message: "Terme de recherche requis",
        });
      }

      const searchTerm = q.trim();
      const snapshot = await this.collection
        .where("isActive", "==", true) // Search only active tariffs
        .where("nationalite", ">=", searchTerm)
        .where("nationalite", "<=", searchTerm + "\uf8ff")
        .orderBy("nationalite") // Order by the field being searched for efficient queries
        .limit(20)
        .get();

      const tarifs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({
        status: true,
        data: tarifs,
        searchTerm,
        count: tarifs.length,
      });
    } catch (error) {
      console.error("Erreur lors de la recherche des tarifs:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la recherche des tarifs",
        error: error.message,
      });
    }
  }

  /**
   * Obtenir les statistiques des tarifs
   * GET /tarifs/stats
   */
  async getStats(req, res) {
    try {
      const snapshot = await this.collection.where("isActive", "==", true).get(); // Stats only for active tariffs
      const tarifs = snapshot.docs.map((doc) => doc.data());

      const stats = {
        total: tarifs.length,
        totalMontant: tarifs.reduce((sum, tarif) => sum + tarif.montant, 0),
        moyenneMontant:
          tarifs.length > 0
            ? (
                tarifs.reduce((sum, tarif) => sum + tarif.montant, 0) /
                tarifs.length
              ).toFixed(2)
            : 0,
        tarifMaxMontant:
          tarifs.length > 0 ? Math.max(...tarifs.map((t) => t.montant)) : 0,
        tarifMinMontant:
          tarifs.length > 0 ? Math.min(...tarifs.map((t) => t.montant)) : 0,
      };

      return res.status(200).json({
        status: true,
        data: stats,
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la récupération des statistiques",
        error: error.message,
      });
    }
  }
}

module.exports = new TarifController();
