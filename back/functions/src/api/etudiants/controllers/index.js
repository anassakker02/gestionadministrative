const Etudiant = require('../../../classes/Etudiant');
const db = require('../../../config/firebase');

class EtudiantController {
  constructor() {
    this.collection = db.collection('etudiants');
  }

  /**
   * Créer un nouvel étudiant
   * POST /etudiants
   */
  async create(req, res) {
    try {
      const { nom, prenom, date_naissance, classe_id, nationalite, bourse_id } = req.body;

      // Validation des données obligatoires
      if (!nom || !prenom || !date_naissance || !classe_id || !nationalite) {
        return res.status(400).json({
          status: false,
          message: 'Le nom, prénom, date de naissance, classe et nationalité sont requis',
        });
      }

      // Validation du nom
      if (nom.trim().length < 2) {
        return res.status(400).json({
          status: false,
          message: 'Le nom doit contenir au moins 2 caractères',
        });
      }

      // Validation du prénom
      if (prenom.trim().length < 2) {
        return res.status(400).json({
          status: false,
          message: 'Le prénom doit contenir au moins 2 caractères',
        });
      }

      // Validation de la date de naissance
      const dateNaissance = new Date(date_naissance);
      if (isNaN(dateNaissance.getTime())) {
        return res.status(400).json({
          status: false,
          message: 'Format de date invalide',
        });
      }

      // Calculer l'âge
      const aujourd = new Date();
      let age = aujourd.getFullYear() - dateNaissance.getFullYear();
      const moisDiff = aujourd.getMonth() - dateNaissance.getMonth();
      
      if (moisDiff < 0 || (moisDiff === 0 && aujourd.getDate() < dateNaissance.getDate())) {
        age--;
      }

      if (age < 3 || age > 25) {
        return res.status(400).json({
          status: false,
          message: 'L\'âge doit être entre 3 et 25 ans',
        });
      }

      // Vérifier que la classe existe
      const classeRef = db.collection('classes').doc(classe_id);
      const classeDoc = await classeRef.get();
      if (!classeDoc.exists) {
        return res.status(400).json({
          status: false,
          message: 'La classe spécifiée n\'existe pas',
        });
      }

      // Vérifier que la bourse existe si elle est fournie et non vide
      if (bourse_id && bourse_id.trim() !== '') {
        const bourseRef = db.collection('bourses').doc(bourse_id);
        const bourseDoc = await bourseRef.get();
        if (!bourseDoc.exists) {
          return res.status(400).json({
            status: false,
            message: 'La bourse spécifiée n\'existe pas',
          });
        }
      }

      // Vérifier l'unicité nom + prénom + date de naissance
      const existingEtudiant = await db.collection('etudiants')
        .where('nom', '==', nom.trim())
        .where('prenom', '==', prenom.trim())
        .where('date_naissance', '==', date_naissance)
        .get();

      if (!existingEtudiant.empty) {
        return res.status(409).json({
          status: false,
          message: 'Un étudiant avec ces informations existe déjà',
        });
      }

      // Créer le nouvel étudiant
      const etudiantData = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        date_naissance: date_naissance,
        classe_id: classe_id,
        nationalite: nationalite.trim(),
        bourse_id: bourse_id && bourse_id.trim() !== '' ? bourse_id : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await this.collection.add(etudiantData);
      const newEtudiant = await docRef.get();

      return res.status(201).json({
        status: true,
        message: 'Étudiant créé avec succès',
        data: {
          id: newEtudiant.id,
          ...newEtudiant.data(),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la création de l\'étudiant:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur interne du serveur',
        error: error.message,
      });
    }
  }

  /**
   * Récupérer tous les étudiants
   * GET /etudiants
   */
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, search, classe_id, bourse_id, nationalite } = req.query;
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);

      let query = this.collection.orderBy('createdAt', 'desc');

      // Filtres
      if (classe_id) {
        query = query.where('classe_id', '==', classe_id);
      }

      if (bourse_id) {
        query = query.where('bourse_id', '==', bourse_id);
      }

      if (nationalite) {
        query = query.where('nationalite', '==', nationalite);
      }

      // Recherche par nom ou prénom
      if (search && search.trim()) {
        const searchTerm = search.trim();
        // Note: Firestore ne supporte pas les recherches OR complexes
        // On utilise une approche simple avec le nom
        query = query.where('nom', '>=', searchTerm)
          .where('nom', '<=', searchTerm + '\uf8ff');
      }

      // Pagination
      const offset = (pageNumber - 1) * limitNumber;
      const snapshot = await query.limit(limitNumber).offset(offset).get();

      const etudiants = [];
      
      // Récupérer les données complètes avec les relations
      for (const doc of snapshot.docs) {
        const etudiantData = doc.data();
        
        // Récupérer les informations de la classe
        let classeInfo = null;
        if (etudiantData.classe_id) {
          const classeDoc = await db.collection('classes').doc(etudiantData.classe_id).get();
          if (classeDoc.exists) {
            classeInfo = { id: classeDoc.id, ...classeDoc.data() };
          }
        }

        // Récupérer les informations de la bourse
        let bourseInfo = null;
        if (etudiantData.bourse_id) {
          const bourseDoc = await db.collection('bourses').doc(etudiantData.bourse_id).get();
          if (bourseDoc.exists) {
            bourseInfo = { id: bourseDoc.id, ...bourseDoc.data() };
          }
        }

        etudiants.push({
          id: doc.id,
          ...etudiantData,
          classe: classeInfo,
          bourse: bourseInfo,
        });
      }

      // Compter le total des documents pour la pagination
      const totalSnapshot = await this.collection.get();
      const total = totalSnapshot.size;

      return res.status(200).json({
        status: true,
        data: etudiants,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(total / limitNumber),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des étudiants:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la récupération des étudiants',
        error: error.message,
      });
    }
  }

  /**
   * Récupérer un étudiant par ID
   * GET /etudiants/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: 'ID de l\'étudiant requis',
        });
      }

      const etudiantDoc = await this.collection.doc(id).get();

      if (!etudiantDoc.exists) {
        return res.status(404).json({
          status: false,
          message: 'Étudiant non trouvé',
        });
      }

      const etudiantData = etudiantDoc.data();

      // Récupérer les informations de la classe
      let classeInfo = null;
      if (etudiantData.classe_id) {
        const classeDoc = await db.collection('classes').doc(etudiantData.classe_id).get();
        if (classeDoc.exists) {
          classeInfo = { id: classeDoc.id, ...classeDoc.data() };
        }
      }

      // Récupérer les informations de la bourse
      let bourseInfo = null;
      if (etudiantData.bourse_id) {
        const bourseDoc = await db.collection('bourses').doc(etudiantData.bourse_id).get();
        if (bourseDoc.exists) {
          bourseInfo = { id: bourseDoc.id, ...bourseDoc.data() };
        }
      }

      const etudiant = new Etudiant({
        id: etudiantDoc.id,
        ...etudiantData,
      });

      return res.status(200).json({
        status: true,
        data: {
          ...etudiant.toJSON(),
          classe: classeInfo,
          bourse: bourseInfo,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'étudiant:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la récupération de l\'étudiant',
        error: error.message,
      });
    }
  }

  /**
   * Mettre à jour un étudiant
   * PUT /etudiants/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nom, prenom, date_naissance, classe_id, nationalite, bourse_id } = req.body;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: 'ID de l\'étudiant requis',
        });
      }

      // Vérifier si l'étudiant existe
      const etudiantRef = this.collection.doc(id);
      const etudiantDoc = await etudiantRef.get();

      if (!etudiantDoc.exists) {
        return res.status(404).json({
          status: false,
          message: 'Étudiant non trouvé',
        });
      }

      const currentData = etudiantDoc.data();

      // Validation des données
      if (nom !== undefined && (!nom || nom.trim().length < 2)) {
        return res.status(400).json({
          status: false,
          message: 'Le nom doit contenir au moins 2 caractères',
        });
      }

      if (prenom !== undefined && (!prenom || prenom.trim().length < 2)) {
        return res.status(400).json({
          status: false,
          message: 'Le prénom doit contenir au moins 2 caractères',
        });
      }

      if (date_naissance !== undefined) {
        const birthDate = new Date(date_naissance);
        if (isNaN(birthDate.getTime())) {
          return res.status(400).json({
            status: false,
            message: 'Format de date invalide',
          });
        }

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const moisDiff = today.getMonth() - birthDate.getMonth();
        if (moisDiff < 0 || (moisDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age < 3 || age > 25) {
          return res.status(400).json({
            status: false,
            message: 'L\'âge doit être entre 3 et 25 ans',
          });
        }
      }

      // Vérifier que la classe existe si elle est mise à jour
      if (classe_id && classe_id !== currentData.classe_id) {
        const classeRef = db.collection('classes').doc(classe_id);
        const classeDoc = await classeRef.get();
        if (!classeDoc.exists) {
          return res.status(400).json({
            status: false,
            message: 'La classe spécifiée n\'existe pas',
          });
        }
      }

      // Vérifier que la bourse existe si elle est mise à jour
      if (bourse_id !== undefined && bourse_id !== currentData.bourse_id) {
        if (bourse_id) {
          const bourseRef = db.collection('bourses').doc(bourse_id);
          const bourseDoc = await bourseRef.get();
          if (!bourseDoc.exists) {
            return res.status(400).json({
              status: false,
              message: 'La bourse spécifiée n\'existe pas',
            });
          }
        }
      }

      // Vérifier l'unicité si le nom/prénom/date changent
      if ((nom && nom !== currentData.nom) || 
          (prenom && prenom !== currentData.prenom) || 
          (date_naissance && date_naissance !== currentData.date_naissance)) {
        
        const searchNom = nom || currentData.nom;
        const searchPrenom = prenom || currentData.prenom;
        const searchDate = date_naissance || currentData.date_naissance;

        const existingStudent = await this.collection
          .where('nom', '==', searchNom.trim())
          .where('prenom', '==', searchPrenom.trim())
          .where('date_naissance', '==', searchDate)
          .get();

        // Vérifier qu'il n'y a pas d'autre étudiant avec ces informations
        const hasConflict = existingStudent.docs.some(doc => doc.id !== id);
        if (hasConflict) {
          return res.status(409).json({
            status: false,
            message: 'Un autre étudiant avec ces informations existe déjà',
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

      if (prenom !== undefined) {
        updateData.prenom = prenom.trim();
      }

      if (date_naissance !== undefined) {
        updateData.date_naissance = date_naissance;
      }

      if (classe_id !== undefined) {
        updateData.classe_id = classe_id;
      }

      if (nationalite !== undefined) {
        updateData.nationalite = nationalite.trim();
      }

      if (bourse_id !== undefined) {
        updateData.bourse_id = bourse_id;
      }

      // Mettre à jour l'étudiant
      await etudiantRef.update(updateData);

      // Récupérer l'étudiant mis à jour
      const updatedEtudiant = await etudiantRef.get();

      return res.status(200).json({
        status: true,
        message: 'Étudiant mis à jour avec succès',
        data: {
          id: updatedEtudiant.id,
          ...updatedEtudiant.data(),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'étudiant:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la mise à jour de l\'étudiant',
        error: error.message,
      });
    }
  }

  /**
   * Supprimer un étudiant
   * DELETE /etudiants/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: 'ID de l\'étudiant requis',
        });
      }

      // Vérifier si l'étudiant existe
      const etudiantRef = this.collection.doc(id);
      const etudiantDoc = await etudiantRef.get();

      if (!etudiantDoc.exists) {
        return res.status(404).json({
          status: false,
          message: 'Étudiant non trouvé',
        });
      }

      // Vérifier si l'étudiant a des factures
      const facturesRef = db.collection('factures');
      const facturesSnapshot = await facturesRef
        .where('student_id', '==', id)
        .get();

      if (!facturesSnapshot.empty) {
        return res.status(400).json({
          status: false,
          message: 'Impossible de supprimer cet étudiant car il a des factures associées',
        });
      }

      // Vérifier si l'étudiant a des échéanciers
      const echeanciersRef = db.collection('echeanciers');
      const echeanciersSnapshot = await echeanciersRef
        .where('student_id', '==', id)
        .get();

      if (!echeanciersSnapshot.empty) {
        return res.status(400).json({
          status: false,
          message: 'Impossible de supprimer cet étudiant car il a des échéanciers associés',
        });
      }

      // Supprimer l'étudiant
      await etudiantRef.delete();

      return res.status(200).json({
        status: true,
        message: 'Étudiant supprimé avec succès',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'étudiant:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la suppression de l\'étudiant',
        error: error.message,
      });
    }
  }

  /**
   * Rechercher des étudiants
   * GET /etudiants/search?q=terme
   */
  async search(req, res) {
    try {
      const { q, classe_id, nationalite } = req.query;

      if (!q || q.trim() === '') {
        return res.status(400).json({
          status: false,
          message: 'Terme de recherche requis',
        });
      }

      const searchTerm = q.trim();
      let query = this.collection;

      // Recherche par nom ou prénom
      if (searchTerm.length >= 2) {
        query = query.where('nom', '>=', searchTerm)
          .where('nom', '<=', searchTerm + '\uf8ff');
      }

      // Filtres additionnels
      if (classe_id) {
        query = query.where('classe_id', '==', classe_id);
      }

      if (nationalite) {
        query = query.where('nationalite', '==', nationalite);
      }

      const snapshot = await query.limit(20).get();

      const etudiants = [];
      
      // Récupérer les données avec relations
      for (const doc of snapshot.docs) {
        const etudiantData = doc.data();
        
        // Récupérer les informations de la classe
        let classeInfo = null;
        if (etudiantData.classe_id) {
          const classeDoc = await db.collection('classes').doc(etudiantData.classe_id).get();
          if (classeDoc.exists) {
            classeInfo = { id: classeDoc.id, ...classeDoc.data() };
          }
        }

        etudiants.push({
          id: doc.id,
          ...etudiantData,
          classe: classeInfo,
        });
      }

      return res.status(200).json({
        status: true,
        data: etudiants,
        searchTerm,
        count: etudiants.length,
      });
    } catch (error) {
      console.error('Erreur lors de la recherche des étudiants:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la recherche des étudiants',
        error: error.message,
      });
    }
  }

  /**
   * Obtenir les statistiques des étudiants
   * GET /etudiants/stats
   */
  async getStats(req, res) {
    try {
      const { classe_id, nationalite } = req.query;

      let query = this.collection;

      // Appliquer les filtres si spécifiés
      if (classe_id) {
        query = query.where('classe_id', '==', classe_id);
      }

      if (nationalite) {
        query = query.where('nationalite', '==', nationalite);
      }

      const snapshot = await query.get();
      const etudiants = snapshot.docs.map(doc => doc.data());

      // Calculer les statistiques
      const stats = {
        total: etudiants.length,
        parClasse: {},
        parNationalite: {},
        avecBourse: 0,
        sansBourse: 0,
        moyenneAge: 0,
      };

      let totalAge = 0;
      let validAges = 0;

      etudiants.forEach(etudiant => {
        // Statistiques par classe
        if (etudiant.classe_id) {
          stats.parClasse[etudiant.classe_id] = (stats.parClasse[etudiant.classe_id] || 0) + 1;
        }

        // Statistiques par nationalité
        if (etudiant.nationalite) {
          stats.parNationalite[etudiant.nationalite] = (stats.parNationalite[etudiant.nationalite] || 0) + 1;
        }

        // Statistiques des bourses
        if (etudiant.bourse_id) {
          stats.avecBourse++;
        } else {
          stats.sansBourse++;
        }

        // Calcul de l'âge moyen
        if (etudiant.date_naissance) {
          const birthDate = new Date(etudiant.date_naissance);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const moisDiff = today.getMonth() - birthDate.getMonth();
          if (!isNaN(age) && age > 0 && age < 100 && moisDiff >= 0) {
            totalAge += age;
            validAges++;
          }
        }
      });

      stats.moyenneAge = validAges > 0 ? Math.round(totalAge / validAges) : 0;

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
   * Obtenir les étudiants par classe
   * GET /etudiants/classe/:classe_id
   */
  async getByClasse(req, res) {
    try {
      const { classe_id } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);

      if (!classe_id) {
        return res.status(400).json({
          status: false,
          message: 'ID de la classe requis',
        });
      }

      // Vérifier que la classe existe
      const classeRef = db.collection('classes').doc(classe_id);
      const classeDoc = await classeRef.get();
      if (!classeDoc.exists) {
        return res.status(404).json({
          status: false,
          message: 'Classe non trouvée',
        });
      }

      // Récupérer les étudiants de cette classe
      const snapshot = await this.collection
        .where('classe_id', '==', classe_id)
        .orderBy('nom')
        .orderBy('prenom')
        .limit(limitNumber)
        .offset((pageNumber - 1) * limitNumber)
        .get();

      const etudiants = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Compter le total
      const totalSnapshot = await this.collection
        .where('classe_id', '==', classe_id)
        .get();
      const total = totalSnapshot.size;

      return res.status(200).json({
        status: true,
        data: etudiants,
        classe: { id: classeDoc.id, ...classeDoc.data() },
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(total / limitNumber),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des étudiants par classe:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la récupération des étudiants par classe',
        error: error.message,
      });
    }
  }
}

module.exports = new EtudiantController();
