const Facture = require('../../../classes/Facture');
const db = require('../../../config/firebase');

class FactureController {
  constructor() {
    this.collection = db.collection('factures');
  }

  /**
   * Créer une nouvelle facture
   * POST /factures
   */
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

      // Validation des données obligatoires
      if (!student_id || !montant_total || !statut) {
        return res.status(400).json({
          status: false,
          message: 'L\'étudiant, le montant total et le statut sont requis',
        });
      }

      // Validation du montant
      if (typeof montant_total !== 'number' || montant_total <= 0) {
        return res.status(400).json({
          status: false,
          message: 'Le montant total doit être un nombre positif',
        });
      }

      // Validation du statut
      const statutsValides = ['payée', 'impayée', 'partielle', 'annulée', 'en_attente'];
      if (!statutsValides.includes(statut)) {
        return res.status(400).json({
          status: false,
          message: 'Statut invalide. Statuts acceptés: payée, impayée, partielle, annulée, en_attente',
        });
      }

      // Vérifier que l'étudiant existe
      const etudiantRef = db.collection('etudiants').doc(student_id);
      const etudiantDoc = await etudiantRef.get();
      if (!etudiantDoc.exists) {
        return res.status(400).json({
          status: false,
          message: 'L\'étudiant spécifié n\'existe pas',
        });
      }

      // Générer un numéro de facture automatique si non fourni
      let numeroFacture = numero_facture;
      if (!numero_facture) {
        const annee = new Date().getFullYear();
        const countSnapshot = await this.collection
          .where('numero_facture', '>=', `${annee}-`)
          .where('numero_facture', '<=', `${annee}-999999`)
          .get();
        const count = countSnapshot.size + 1;
        numeroFacture = `${annee}-${count.toString().padStart(6, '0')}`;
      }

      // Vérifier l'unicité du numéro de facture
      const existingFacture = await this.collection
        .where('numero_facture', '==', numeroFacture)
        .get();

      if (!existingFacture.empty) {
        return res.status(409).json({
          status: false,
          message: 'Une facture avec ce numéro existe déjà',
        });
      }

      // Créer la nouvelle facture
      const factureData = {
        student_id: student_id,
        date_emission: date_emission || new Date().toISOString(),
        montant_total: montant_total,
        statut: statut,
        numero_facture: numeroFacture,
        pdf_url: pdf_url || null,
        description: description || '',
        echeances: echeances || [],
        remises: remises || [],
        montant_paye: statut === 'payée' ? montant_total : 0,
        montant_restant: statut === 'payée' ? 0 : montant_total,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await this.collection.add(factureData);
      const newFacture = await docRef.get();

      return res.status(201).json({
        status: true,
        message: 'Facture créée avec succès',
        data: {
          id: newFacture.id,
          ...newFacture.data(),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la création de la facture:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur interne du serveur',
        error: error.message,
      });
    }
  }

  /**
   * Récupérer toutes les factures
   * GET /factures
   */
  async getAll(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        statut, 
        student_id, 
        date_debut, 
        date_fin,
        montant_min,
        montant_max
      } = req.query;
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);

      let query = this.collection.orderBy('date_emission', 'desc');

      // Filtres
      if (statut) {
        query = query.where('statut', '==', statut);
      }

      if (student_id) {
        query = query.where('student_id', '==', student_id);
      }

      if (date_debut) {
        query = query.where('date_emission', '>=', date_debut);
      }

      if (date_fin) {
        query = query.where('date_emission', '<=', date_fin);
      }

      // Pagination
      const offset = (pageNumber - 1) * limitNumber;
      const snapshot = await query.limit(limitNumber).offset(offset).get();

      const factures = [];
      
      // Récupérer les données avec les informations de l'étudiant
      for (const doc of snapshot.docs) {
        const factureData = doc.data();
        
        // Récupérer les informations de l'étudiant
        const etudiantDoc = await db.collection('etudiants')
          .doc(factureData.student_id)
          .get();
        
        let etudiantInfo = null;
        if (etudiantDoc.exists) {
          etudiantInfo = { id: etudiantDoc.id, ...etudiantDoc.data() };
        }

        factures.push({
          id: doc.id,
          ...factureData,
          etudiant: etudiantInfo,
        });
      }

      // Compter le total des documents pour la pagination
      const totalSnapshot = await this.collection.get();
      const total = totalSnapshot.size;

      return res.status(200).json({
        status: true,
        data: factures,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(total / limitNumber),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des factures:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la récupération des factures',
        error: error.message,
      });
    }
  }

  /**
   * Récupérer une facture par ID
   * GET /factures/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: 'ID de la facture requis',
        });
      }

      const factureDoc = await this.collection.doc(id).get();

      if (!factureDoc.exists) {
        return res.status(404).json({
          status: false,
          message: 'Facture non trouvée',
        });
      }

      const factureData = factureDoc.data();

      // Récupérer les informations de l'étudiant
      const etudiantDoc = await db.collection('etudiants')
        .doc(factureData.student_id)
        .get();

      let etudiantInfo = null;
      if (etudiantDoc.exists) {
        etudiantInfo = { id: etudiantDoc.id, ...etudiantDoc.data() };
      }

      // Récupérer les échéanciers associés
      const echeanciersSnapshot = await db.collection('echeanciers')
        .where('facture_id', '==', id)
        .orderBy('date_echeance')
        .get();

      const echeanciers = echeanciersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      const facture = new Facture({
        id: factureDoc.id,
        ...factureData,
      });

      return res.status(200).json({
        status: true,
        data: {
          ...facture.toJSON(),
          etudiant: etudiantInfo,
          echeanciers: echeanciers,
          montant_paye: factureData.montant_paye || 0,
          montant_restant: factureData.montant_restant || factureData.montant_total,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération de la facture:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la récupération de la facture',
        error: error.message,
      });
    }
  }

  /**
   * Mettre à jour une facture
   * PUT /factures/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { 
        statut, 
        montant_total, 
        pdf_url, 
        description,
        echeances,
        remises,
        montant_paye
      } = req.body;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: 'ID de la facture requis',
        });
      }

      // Vérifier si la facture existe
      const factureRef = this.collection.doc(id);
      const factureDoc = await factureRef.get();

      if (!factureDoc.exists) {
        return res.status(404).json({
          status: false,
          message: 'Facture non trouvée',
        });
      }

      const currentData = factureDoc.data();

      // Validation du statut si fourni
      if (statut !== undefined) {
        const statutsValides = ['payée', 'impayée', 'partielle', 'annulée', 'en_attente'];
        if (!statutsValides.includes(statut)) {
          return res.status(400).json({
            status: false,
            message: 'Statut invalide. Statuts acceptés: payée, impayée, partielle, annulée, en_attente',
          });
        }
      }

      // Validation du montant si fourni
      if (montant_total !== undefined && (typeof montant_total !== 'number' || montant_total <= 0)) {
        return res.status(400).json({
          status: false,
          message: 'Le montant total doit être un nombre positif',
        });
      }

      // Validation du montant payé
      if (montant_paye !== undefined) {
        if (typeof montant_paye !== 'number' || montant_paye < 0) {
          return res.status(400).json({
            status: false,
            message: 'Le montant payé doit être un nombre positif ou nul',
          });
        }

        const montantTotal = montant_total || currentData.montant_total;
        if (montant_paye > montantTotal) {
          return res.status(400).json({
            status: false,
            message: 'Le montant payé ne peut pas dépasser le montant total',
          });
        }
      }

      // Préparer les données de mise à jour
      const updateData = {
        updatedAt: new Date(),
      };

      if (statut !== undefined) {
        updateData.statut = statut;
      }

      if (montant_total !== undefined) {
        updateData.montant_total = montant_total;
      }

      if (pdf_url !== undefined) {
        updateData.pdf_url = pdf_url;
      }

      if (description !== undefined) {
        updateData.description = description;
      }

      if (echeances !== undefined) {
        updateData.echeances = echeances;
      }

      if (remises !== undefined) {
        updateData.remises = remises;
      }

      if (montant_paye !== undefined) {
        updateData.montant_paye = montant_paye;
        updateData.montant_restant = (montant_total || currentData.montant_total) - montant_paye;
        
        // Mettre à jour le statut automatiquement selon le montant payé
        if (montant_paye === 0) {
          updateData.statut = 'impayée';
        } else if (montant_paye >= (montant_total || currentData.montant_total)) {
          updateData.statut = 'payée';
        } else {
          updateData.statut = 'partielle';
        }
      }

      // Mettre à jour la facture
      await factureRef.update(updateData);

      // Récupérer la facture mise à jour
      const updatedFacture = await factureRef.get();

      return res.status(200).json({
        status: true,
        message: 'Facture mise à jour avec succès',
        data: {
          id: updatedFacture.id,
          ...updatedFacture.data(),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la facture:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la mise à jour de la facture',
        error: error.message,
      });
    }
  }

  /**
   * Supprimer une facture
   * DELETE /factures/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: 'ID de la facture requis',
        });
      }

      // Vérifier si la facture existe
      const factureRef = this.collection.doc(id);
      const factureDoc = await factureRef.get();

      if (!factureDoc.exists) {
        return res.status(404).json({
          status: false,
          message: 'Facture non trouvée',
        });
      }

      // Vérifier si la facture a des échéanciers associés
      const echeanciersSnapshot = await db.collection('echeanciers')
        .where('facture_id', '==', id)
        .get();

      if (!echeanciersSnapshot.empty) {
        return res.status(400).json({
          status: false,
          message: 'Impossible de supprimer cette facture car elle a des échéanciers associés',
        });
      }

      // Supprimer la facture
      await factureRef.delete();

      return res.status(200).json({
        status: true,
        message: 'Facture supprimée avec succès',
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de la facture:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la suppression de la facture',
        error: error.message,
      });
    }
  }

  /**
   * Rechercher des factures
   * GET /factures/search?q=terme
   */
  async search(req, res) {
    try {
      const { q, statut, student_id, date_debut, date_fin } = req.query;

      if (!q || q.trim() === '') {
        return res.status(400).json({
          status: false,
          message: 'Terme de recherche requis',
        });
      }

      const searchTerm = q.trim();
      let query = this.collection;

      // Recherche par numéro de facture
      if (searchTerm.length >= 3) {
        query = query.where('numero_facture', '>=', searchTerm)
                    .where('numero_facture', '<=', searchTerm + '\uf8ff');
      }

      // Filtres additionnels
      if (statut) {
        query = query.where('statut', '==', statut);
      }

      if (student_id) {
        query = query.where('student_id', '==', student_id);
      }

      if (date_debut) {
        query = query.where('date_emission', '>=', date_debut);
      }

      if (date_fin) {
        query = query.where('date_emission', '<=', date_fin);
      }

      const snapshot = await query.limit(20).get();

      const factures = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      return res.status(200).json({
        status: true,
        data: factures,
        searchTerm,
        count: factures.length,
      });
    } catch (error) {
      console.error('Erreur lors de la recherche des factures:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la recherche des factures',
        error: error.message,
      });
    }
  }

  /**
   * Obtenir les statistiques des factures
   * GET /factures/stats
   */
  async getStats(req, res) {
    try {
      const { student_id, date_debut, date_fin } = req.query;

      let query = this.collection;
      if (student_id) {
        query = query.where('student_id', '==', student_id);
      }

      if (date_debut) {
        query = query.where('date_emission', '>=', date_debut);
      }

      if (date_fin) {
        query = query.where('date_emission', '<=', date_fin);
      }

      const snapshot = await query.get();
      const factures = snapshot.docs.map(doc => doc.data());

      // Calculer les statistiques
      const stats = {
        total: factures.length,
        parStatut: {},
        montantTotal: 0,
        montantPaye: 0,
        montantRestant: 0,
        moyenneMontant: 0,
        parMois: {},
        parAnnee: {},
      };

      let totalMontant = 0;
      let totalPaye = 0;

      factures.forEach(facture => {
        // Statistiques par statut
        if (facture.statut) {
          stats.parStatut[facture.statut] = (stats.parStatut[facture.statut] || 0) + 1;
        }

        // Montants
        totalMontant += facture.montant_total || 0;
        totalPaye += facture.montant_paye || 0;

        // Statistiques par mois/année
        if (facture.date_emission) {
          const date = new Date(facture.date_emission);
          const mois = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          const annee = date.getFullYear().toString();

          stats.parMois[mois] = (stats.parMois[mois] || 0) + 1;
          stats.parAnnee[annee] = (stats.parAnnee[annee] || 0) + 1;
        }
      });

      stats.montantTotal = totalMontant;
      stats.montantPaye = totalPaye;
      stats.montantRestant = totalMontant - totalPaye;
      stats.moyenneMontant = factures.length > 0 ? Math.round(totalMontant / factures.length * 100) / 100 : 0;

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
   * Obtenir les factures par étudiant
   * GET /factures/etudiant/:student_id
   */
  async getByStudent(req, res) {
    try {
      const { student_id } = req.params;
      const { page = 1, limit = 20, statut } = req.query;
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);

      if (!student_id) {
        return res.status(400).json({
          status: false,
          message: 'ID de l\'étudiant requis',
        });
      }

      // Vérifier que l'étudiant existe
      const etudiantDoc = await db.collection('etudiants').doc(student_id).get();
      if (!etudiantDoc.exists) {
        return res.status(404).json({
          status: false,
          message: 'Étudiant non trouvé',
        });
      }

      let query = this.collection.where('student_id', '==', student_id);

      if (statut) {
        query = query.where('statut', '==', statut);
      }

      const snapshot = await query
        .orderBy('date_emission', 'desc')
        .limit(limitNumber)
        .offset((pageNumber - 1) * limitNumber)
        .get();

      const factures = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Compter le total
      const totalSnapshot = await this.collection
        .where('student_id', '==', student_id)
        .get();
      const total = totalSnapshot.size;

      return res.status(200).json({
        status: true,
        data: factures,
        etudiant: { id: etudiantDoc.id, ...etudiantDoc.data() },
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(total / limitNumber),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des factures par étudiant:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la récupération des factures par étudiant',
        error: error.message,
      });
    }
  }

  /**
   * Obtenir les factures par statut
   * GET /factures/statut/:statut
   */
  async getByStatus(req, res) {
    try {
      const { statut } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);

      if (!statut) {
        return res.status(400).json({
          status: false,
          message: 'Statut requis',
        });
      }

      // Validation du statut
      const statutsValides = ['payée', 'impayée', 'partielle', 'annulée', 'en_attente'];
      if (!statutsValides.includes(statut)) {
        return res.status(400).json({
          status: false,
          message: 'Statut invalide',
        });
      }

      const snapshot = await this.collection
        .where('statut', '==', statut)
        .orderBy('date_emission', 'desc')
        .limit(limitNumber)
        .offset((pageNumber - 1) * limitNumber)
        .get();

      const factures = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Compter le total
      const totalSnapshot = await this.collection
        .where('statut', '==', statut)
        .get();
      const total = totalSnapshot.size;

      return res.status(200).json({
        status: true,
        data: factures,
        statut,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(total / limitNumber),
        },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des factures par statut:', error);
      return res.status(500).json({
        status: false,
        message: 'Erreur lors de la récupération des factures par statut',
        error: error.message,
      });
    }
  }
}

module.exports = new FactureController();
