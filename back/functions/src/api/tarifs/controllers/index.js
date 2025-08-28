const Tarif = require("../../../classes/Tarif");
const db = require("../../../config/firebase");

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
      const { nom, montant } = req.body;

      // Validation des données
      if (!nom || montant === undefined) {
        return res.status(400).json({
          status: false,
          message: "Le nom et le montant sont requis",
        });
      }

      if (typeof montant !== "number" || montant < 0) {
        return res.status(400).json({
          status: false,
          message: "Le montant doit être un nombre positif",
        });
      }

      // Vérifier si un tarif avec le même nom existe déjà
      const existingTarif = await this.collection
        .where("nom", "==", nom.trim())
        .get();
      if (!existingTarif.empty) {
        return res.status(409).json({
          status: false,
          message: "Un tarif avec ce nom existe déjà",
        });
      }

      // Créer le nouveau tarif
      const tarifData = {
        nom: nom.trim(),
        montant: Number(montant),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await this.collection.add(tarifData);
      const newTarif = await docRef.get();

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

      let query = this.collection.orderBy("createdAt", "desc");

      // Recherche par nom si le paramètre search est fourni
      if (search && search.trim()) {
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
      const totalSnapshot = await this.collection.get();
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
      const { nom, montant } = req.body;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: "ID du tarif requis",
        });
      }

      // Vérifier si le tarif existe
      const tarifRef = this.collection.doc(id);
      const tarifDoc = await tarifRef.get();

      if (!tarifDoc.exists) {
        return res.status(404).json({
          status: false,
          message: "Tarif non trouvé",
        });
      }

      // Validation des données
      if (nom !== undefined && (!nom || nom.trim() === "")) {
        return res.status(400).json({
          status: false,
          message: "Le nom ne peut pas être vide",
        });
      }

      if (
        montant !== undefined &&
        (typeof montant !== "number" || montant < 0)
      ) {
        return res.status(400).json({
          status: false,
          message: "Le montant doit être un nombre positif",
        });
      }

      // Vérifier si le nouveau nom n'existe pas déjà (sauf pour le tarif actuel)
      if (nom && nom.trim() !== tarifDoc.data().nom) {
        const existingTarif = await this.collection
          .where("nom", "==", nom.trim())
          .get();

        if (!existingTarif.empty) {
          return res.status(409).json({
            status: false,
            message: "Un tarif avec ce nom existe déjà",
          });
        }
      }

      // Préparer les données de mise à jour
      const updateData = {
        updatedAt: new Date(),
      };

      if (nom !== undefined) {
        updateData.nom = nom.trim();
      }

      if (montant !== undefined) {
        updateData.montant = Number(montant);
      }

      // Mettre à jour le tarif
      await tarifRef.update(updateData);

      // Récupérer le tarif mis à jour
      const updatedTarif = await tarifRef.get();

      return res.status(200).json({
        status: true,
        message: "Tarif mis à jour avec succès",
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

      // Vérifier si le tarif existe
      const tarifRef = this.collection.doc(id);
      const tarifDoc = await tarifRef.get();

      if (!tarifDoc.exists) {
        return res.status(404).json({
          status: false,
          message: "Tarif non trouvé",
        });
      }

      // Vérifier si le tarif est utilisé par des factures
      const facturesRef = db.collection("factures");
      const facturesSnapshot = await facturesRef
        .where("tarif_id", "==", id)
        .get();

      if (!facturesSnapshot.empty) {
        return res.status(400).json({
          status: false,
          message:
            "Impossible de supprimer ce tarif car il est utilisé dans des factures",
        });
      }

      // Supprimer le tarif
      await tarifRef.delete();

      return res.status(200).json({
        status: true,
        message: "Tarif supprimé avec succès",
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
        .where("nom", ">=", searchTerm)
        .where("nom", "<=", searchTerm + "\uf8ff")
        .orderBy("nom")
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
      const snapshot = await this.collection.get();
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
