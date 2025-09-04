const Classe = require('../../../classes/Classe');
const db = require('../../../config/firebase');

class ClasseController {
  constructor() {
    this.collection = db.collection('classes');
  }

  /**
   * Créer une nouvelle classe
   * POST /classes
   */
  async create(req, res) {
    try {
      const { nom, niveau, capacite, description, annee_scolaire } = req.body;

      // Validation des données obligatoires
      if (!nom || !niveau) {
        return res.status(400).json({
          status: false,
          message: 'Le nom et le niveau sont requis',
        });
      }

      // Validation du nom
      if (nom.trim().length < 2) {
        return res.status(400).json({
          status: false,
          message: 'Le nom de la classe doit contenir au moins 2 caractères',
        });
      }

      // Validation du niveau
      const niveauxValides = ['1ère année', '2ème année', '3ème année', '4ème année', '5ème année', 'Master 1', 'Master 2', 'Doctorat'];
      if (!niveauxValides.includes(niveau)) {
        return res.status(400).json({
          status: false,
          message: 'Niveau invalide. Niveaux acceptés: 1ère année, 2ème année, 3ème année, 4ème année, 5ème année, Master 1, Master 2, Doctorat',
        });
      }

      // Validation de la capacité si fournie
      if (capacite !== undefined && (capacite < 1 || capacite > 50)) {
        return res.status(400).json({
          status: false,
          message: 'La capacité doit être entre 1 et 50 élèves',
        });
      }

      // Vérifier l'unicité du nom + niveau + année scolaire
      const annee = annee_scolaire || new Date().getFullYear().toString();
      const existingClasse = await this.collection
        .where('nom', '==', nom.trim())
        .where('niveau', '==', niveau)
        .where('annee_scolaire', '==', annee)
        .get();

      if (!existingClasse.empty) {
        return res.status(409).json({
          status: false,
          message: 'Une classe avec ce nom, niveau et année scolaire existe déjà',
        });
      }

      // Créer la nouvelle classe
      const classeData = {
        nom: nom.trim(),
        niveau: niveau,
        capacite: capacite || 30,
        description: description ? description.trim() : '',
        annee_scolaire: annee,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await this.collection.add(classeData);
      const newClasse = await docRef.get();

      return res.status(201).json({
        status: true,
        message: 'Classe créée avec succès',
        data: {
          id: newClasse.id,
          ...newClasse.data(),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la création de la classe:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur interne du serveur',
        error: error.message,
      });
    }
  }

  /**
   * Récupérer toutes les classes
   * GET /classes
   */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, niveau, annee_scolaire, search } = req.query;
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);

      let query = this.collection.orderBy('niveau').orderBy('nom');

      // Filtres
      if (niveau) {
        query = query.where('niveau', '==', niveau);
      }

      if (annee_scolaire) {
        query = query.where('annee_scolaire', '==', annee_scolaire);
      }

      // Recherche par nom
      if (search && search.trim()) {
        query = query.where('nom', '>=', search.trim())
          .where('nom', '<=', search.trim() + '\uf8ff');
      }

      // Pagination
      const offset = (pageNumber - 1) * limitNumber;
      const snapshot = await query.limit(limitNumber).offset(offset).get();

      const classes = [];
      
      // Récupérer les données avec les statistiques des étudiants
      for (const doc of snapshot.docs) {
        const classeData = doc.data();
        
        // Compter les étudiants dans cette classe
        const etudiantsSnapshot = await db.collection('etudiants')
          .where('classe_id', '==', doc.id)
          .get();
        
        const nombreEtudiants = etudiantsSnapshot.size;
        const tauxOccupation = classeData.capacite ? Math.round((nombreEtudiants / classeData.capacite) * 100) : 0;

        classes.push({
          id: doc.id,
          ...classeData,
          nombreEtudiants,
          tauxOccupation,
        });
      }

      // Compter le total des documents pour la pagination
      const totalSnapshot = await this.collection.get();
      const total = totalSnapshot.size;

      return res.status(200).json({
        status: true,
        data: classes,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(total / limitNumber),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des classes:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la récupération des classes',
        error: error.message,
      });
    }
  }

  /**
   * Récupérer une classe par ID
   * GET /classes/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: 'ID de la classe requis',
        });
      }

      const classeDoc = await this.collection.doc(id).get();

      if (!classeDoc.exists) {
        return res.status(404).json({
          status: false,
          message: 'Classe non trouvée',
        });
      }

      const classeData = classeDoc.data();

      // Récupérer les étudiants de cette classe
      const etudiantsSnapshot = await db.collection('etudiants')
        .where('classe_id', '==', id)
        .orderBy('nom')
        .orderBy('prenom')
        .get();

      const etudiants = etudiantsSnapshot.docs.map(doc => ({
        id: doc.id,
        nom: doc.data().nom,
        prenom: doc.data().prenom,
        nationalite: doc.data().nationalite,
        bourse_id: doc.data().bourse_id,
      }));

      // Compter les statistiques
      const nombreEtudiants = etudiants.length;
      const tauxOccupation = classeData.capacite ? Math.round((nombreEtudiants / classeData.capacite) * 100) : 0;

      const classe = new Classe({
        id: classeDoc.id,
        ...classeData,
      });

      return res.status(200).json({
        status: true,
        data: {
          ...classe.toJSON(),
          capacite: classeData.capacite,
          description: classeData.description,
          annee_scolaire: classeData.annee_scolaire,
          nombreEtudiants,
          tauxOccupation,
          etudiants,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la classe:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la récupération de la classe',
        error: error.message,
      });
    }
  }

  /**
   * Mettre à jour une classe
   * PUT /classes/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nom, niveau, capacite, description, annee_scolaire } = req.body;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: 'ID de la classe requis',
        });
      }

      // Vérifier si la classe existe
      const classeRef = this.collection.doc(id);
      const classeDoc = await classeRef.get();

      if (!classeDoc.exists) {
        return res.status(404).json({
          status: false,
          message: 'Classe non trouvée',
        });
      }

      const currentData = classeDoc.data();

      // Validation des données
      if (nom !== undefined && (!nom || nom.trim().length < 2)) {
        return res.status(400).json({
          status: false,
          message: 'Le nom de la classe doit contenir au moins 2 caractères',
        });
      }

      if (niveau !== undefined) {
        const niveauxValides = ['1ère année', '2ème année', '3ème année', '4ème année', '5ème année', 'Master 1', 'Master 2', 'Doctorat'];
        if (!niveauxValides.includes(niveau)) {
          return res.status(400).json({
            status: false,
            message: 'Niveau invalide. Niveaux acceptés: 1ère année, 2ème année, 3ème année, 4ème année, 5ème année, Master 1, Master 2, Doctorat',
          });
        }
      }

      if (capacite !== undefined && (capacite < 1 || capacite > 50)) {
        return res.status(400).json({
          status: false,
          message: 'La capacité doit être entre 1 et 50 élèves',
        });
      }

      // Vérifier l'unicité si le nom/niveau/année changent
      if ((nom && nom !== currentData.nom) || 
          (niveau && niveau !== currentData.niveau) || 
          (annee_scolaire && annee_scolaire !== currentData.annee_scolaire)) {
        
        const searchNom = nom || currentData.nom;
        const searchNiveau = niveau || currentData.niveau;
        const searchAnnee = annee_scolaire || currentData.annee_scolaire;

        const existingClasse = await this.collection
          .where('nom', '==', searchNom.trim())
          .where('niveau', '==', searchNiveau)
          .where('annee_scolaire', '==', searchAnnee)
          .get();

        // Vérifier qu'il n'y a pas d'autre classe avec ces informations
        const hasConflict = existingClasse.docs.some(doc => doc.id !== id);
        if (hasConflict) {
          return res.status(409).json({
            status: false,
            message: 'Une autre classe avec ces informations existe déjà',
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

      if (niveau !== undefined) {
        updateData.niveau = niveau;
      }

      if (capacite !== undefined) {
        updateData.capacite = capacite;
      }

      if (description !== undefined) {
        updateData.description = description.trim();
      }

      if (annee_scolaire !== undefined) {
        updateData.annee_scolaire = annee_scolaire;
      }

      // Mettre à jour la classe
      await classeRef.update(updateData);

      // Récupérer la classe mise à jour
      const updatedClasse = await classeRef.get();

      return res.status(200).json({
        status: true,
        message: 'Classe mise à jour avec succès',
        data: {
          id: updatedClasse.id,
          ...updatedClasse.data(),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la classe:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la mise à jour de la classe',
        error: error.message,
      });
    }
  }

  /**
   * Supprimer une classe
   * DELETE /classes/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: 'ID de la classe requis',
        });
      }

      // Vérifier si la classe existe
      const classeRef = this.collection.doc(id);
      const classeDoc = await classeRef.get();

      if (!classeDoc.exists) {
        return res.status(404).json({
          status: false,
          message: 'Classe non trouvée',
        });
      }

      // Vérifier si la classe a des étudiants
      const etudiantsSnapshot = await db.collection('etudiants')
        .where('classe_id', '==', id)
        .get();

      if (!etudiantsSnapshot.empty) {
        return res.status(400).json({
          status: false,
          message: 'Impossible de supprimer cette classe car elle contient des étudiants',
        });
      }

      // Supprimer la classe
      await classeRef.delete();

      return res.status(200).json({
        status: true,
        message: 'Classe supprimée avec succès',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la classe:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la suppression de la classe',
        error: error.message,
      });
    }
  }

  /**
   * Rechercher des classes
   * GET /classes/search?q=terme
   */
  async search(req, res) {
    try {
      const { q, niveau, annee_scolaire } = req.query;

      if (!q || q.trim() === '') {
        return res.status(400).json({
          status: false,
          message: 'Terme de recherche requis',
        });
      }

      const searchTerm = q.trim();
      let query = this.collection;

      // Recherche par nom
      if (searchTerm.length >= 2) {
        query = query.where('nom', '>=', searchTerm)
          .where('nom', '<=', searchTerm + '\uf8ff');
      }

      // Filtres additionnels
      if (niveau) {
        query = query.where('niveau', '==', niveau);
      }

      if (annee_scolaire) {
        query = query.where('annee_scolaire', '==', annee_scolaire);
      }

      const snapshot = await query.limit(20).get();

      const classes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({
        status: true,
        data: classes,
        searchTerm,
        count: classes.length,
      });
    } catch (error) {
      console.error('Erreur lors de la recherche des classes:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la recherche des classes',
        error: error.message,
      });
    }
  }

  /**
   * Obtenir les statistiques des classes
   * GET /classes/stats
   */
  async getStats(req, res) {
    try {
      const { annee_scolaire } = req.query;
      const annee = annee_scolaire || new Date().getFullYear().toString();

      let query = this.collection;
      if (annee_scolaire) {
        query = query.where('annee_scolaire', '==', annee);
      }

      const snapshot = await query.get();
      const classes = snapshot.docs.map(doc => doc.data());

      // Calculer les statistiques
      const stats = {
        total: classes.length,
        parNiveau: {},
        parAnnee: {},
        capaciteTotale: 0,
        nombreEtudiantsTotal: 0,
        tauxOccupationMoyen: 0,
        classesCompletes: 0,
        classesDisponibles: 0,
      };

      let totalEtudiants = 0;
      let totalCapacite = 0;

      for (const classe of classes) {
        // Statistiques par niveau
        if (classe.niveau) {
          stats.parNiveau[classe.niveau] = (stats.parNiveau[classe.niveau] || 0) + 1;
        }

        // Statistiques par année
        if (classe.annee_scolaire) {
          stats.parAnnee[classe.annee_scolaire] = (stats.parAnnee[classe.annee_scolaire] || 0) + 1;
        }

        // Compter les étudiants dans cette classe
        const etudiantsSnapshot = await db.collection('etudiants')
          .where('classe_id', '==', classe.id)
          .get();

        const nombreEtudiants = etudiantsSnapshot.size;
        totalEtudiants += nombreEtudiants;
        totalCapacite += classe.capacite || 30;

        // Classes complètes vs disponibles
        if (nombreEtudiants >= (classe.capacite || 30)) {
          stats.classesCompletes++;
        } else {
          stats.classesDisponibles++;
        }
      }

      stats.capaciteTotale = totalCapacite;
      stats.nombreEtudiantsTotal = totalEtudiants;
      stats.tauxOccupationMoyen = totalCapacite > 0 ? Math.round((totalEtudiants / totalCapacite) * 100) : 0;

      return res.status(200).json({
        status: true,
        data: stats,
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message,
      });
    }
  }

  /**
   * Obtenir les classes par niveau
   * GET /classes/niveau/:niveau
   */
  async getByNiveau(req, res) {
    try {
      const { niveau } = req.params;
      const { annee_scolaire, page = 1, limit = 20 } = req.query;
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);

      if (!niveau) {
        return res.status(400).json({
          status: false,
          message: 'Niveau requis',
        });
      }

      // Validation du niveau
      const niveauxValides = ['1ère année', '2ème année', '3ème année', '4ème année', '5ème année', 'Master 1', 'Master 2', 'Doctorat'];
      if (!niveauxValides.includes(niveau)) {
        return res.status(400).json({
          status: false,
          message: 'Niveau invalide',
        });
      }

      let query = this.collection.where('niveau', '==', niveau);

      if (annee_scolaire) {
        query = query.where('annee_scolaire', '==', annee_scolaire);
      }

      const snapshot = await query
        .orderBy('nom')
        .limit(limitNumber)
        .offset((pageNumber - 1) * limitNumber)
        .get();

      const classes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Compter le total
      const totalSnapshot = await query.get();
      const total = totalSnapshot.size;

      return res.status(200).json({
        status: true,
        data: classes,
        niveau,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(total / limitNumber),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des classes par niveau:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la récupération des classes par niveau',
        error: error.message,
      });
    }
  }

  /**
   * Obtenir les classes par année scolaire
   * GET /classes/annee/:annee_scolaire
   */
  async getByAnnee(req, res) {
    try {
      const { annee_scolaire } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);

      if (!annee_scolaire) {
        return res.status(400).json({
          status: false,
          message: 'Année scolaire requise',
        });
      }

      const snapshot = await this.collection
        .where('annee_scolaire', '==', annee_scolaire)
        .orderBy('niveau')
        .orderBy('nom')
        .limit(limitNumber)
        .offset((pageNumber - 1) * limitNumber)
        .get();

      const classes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Compter le total
      const totalSnapshot = await this.collection
        .where('annee_scolaire', '==', annee_scolaire)
        .get();
      const total = totalSnapshot.size;

      return res.status(200).json({
        status: true,
        data: classes,
        annee_scolaire,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(total / limitNumber),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des classes par année:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la récupération des classes par année',
        error: error.message,
      });
    }
  }
}

module.exports = new ClasseController();
