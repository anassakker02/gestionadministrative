const Etudiant = require("../../../classes/Etudiant");
const db = require("../../../config/firebase");
const AuditLog = require("../../../classes/AuditLog");
const { sendWebhook } = require("../../../utils/webhookSender");
const { encrypt, decrypt } = require("../../../utils/encryption");

class EtudiantController {
  constructor() {
    this.collection = db.collection("etudiants");
    this.tarifsCollection = db.collection("tarifs");
    this.boursesCollection = db.collection("bourses");
    this.factureCollection = db.collection("factures");
    this.paiementCollection = db.collection("paiements");
    this.userCollection = db.collection("users");
    this.classesCollection = db.collection("classes");
  }

  /**
   * Créer un nouvel étudiant
   * POST /etudiants
   */
  async create(req, res) {
    try {
      const {
        nom,
        prenom,
        date_naissance,
        classe_id,
        nationalite,
        bourse_id,
        exemptions,
        parentId,
      } = req.body;

      // Validation des données obligatoires
      if (!nom || !prenom || !date_naissance || !classe_id || !nationalite) {
        return res.status(400).json({
          status: false,
          message:
            "Le nom, prénom, date de naissance, classe et nationalité sont requis",
        });
      }

      // Validation du nom
      if (nom.trim().length < 2) {
        return res.status(400).json({
          status: false,
          message: "Le nom doit contenir au moins 2 caractères",
        });
      }

      // Validation du prénom
      if (prenom.trim().length < 2) {
        return res.status(400).json({
          status: false,
          message: "Le prénom doit contenir au moins 2 caractères",
        });
      }

      // Validation de la date de naissance
      const dateNaissance = new Date(date_naissance);
      if (isNaN(dateNaissance.getTime())) {
        return res.status(400).json({
          status: false,
          message: "Format de date invalide",
        });
      }

      // Calculer l'âge
      const aujourd = new Date();
      let age = aujourd.getFullYear() - dateNaissance.getFullYear();
      const moisDiff = aujourd.getMonth() - dateNaissance.getMonth();

      if (
        moisDiff < 0 ||
        (moisDiff === 0 && aujourd.getDate() < dateNaissance.getDate())
      ) {
        age--;
      }

      if (age < 18 || age > 36) {
        return res.status(400).json({
          status: false,
          message: "L'âge doit être entre 3 et 25 ans",
        });
      }

      // Vérifier que la classe existe
      const classeRef = db.collection("classes").doc(classe_id);
      const classeDoc = await classeRef.get();
      if (!classeDoc.exists) {
        return res.status(400).json({
          status: false,
          message: "La classe spécifiée n'existe pas",
        });
      }

      // Si un user_id est fourni, vérifier qu'il existe et qu'il est eligible (role 'user')
      let linkedUserId = null;
      if (req.body.user_id) {
        // Autoriser seulement admin/sub-admin à lier un user existant
        if (
          !req.user ||
          (req.user.role !== "admin" && req.user.role !== "sub-admin")
        ) {
          return res.status(403).json({
            status: false,
            message: "Non autorisé à lier un utilisateur existant",
          });
        }

        const userDoc = await db
          .collection("users")
          .doc(req.body.user_id)
          .get();
        if (!userDoc.exists) {
          return res.status(404).json({
            status: false,
            message: "Utilisateur spécifié introuvable",
          });
        }
        const userData = userDoc.data();
        if (userData.role && userData.role !== "user") {
          return res.status(400).json({
            status: false,
            message:
              "Le compte utilisateur ne peut pas être transformé en étudiant (role invalide)",
          });
        }

        linkedUserId = userDoc.id;
      }

      // Vérifier que la bourse existe si elle est fournie et non vide
      if (bourse_id && bourse_id.trim() !== "") {
        const bourseRef = db.collection("bourses").doc(bourse_id);
        const bourseDoc = await bourseRef.get();
        if (!bourseDoc.exists) {
          return res.status(400).json({
            status: false,
            message: "La bourse spécifiée n'existe pas",
          });
        }
      }

      // Vérifier l'unicité nom + prénom + date de naissance
      const existingEtudiant = await db
        .collection("etudiants")
        .where("nom", "==", nom.trim())
        .where("prenom", "==", prenom.trim())
        .where("date_naissance", "==", date_naissance)
        .get();

      if (!existingEtudiant.empty) {
        return res.status(409).json({
          status: false,
          message: "Un étudiant avec ces informations existe déjà",
        });
      }

      // Récupérer le tarif correspondant
      const tarifsRef = db.collection("tarifs");
      let tarifQuery = tarifsRef
        .where("classe_id", "==", classe_id)
        .where("nationalite", "==", nationalite);

      if (bourse_id && bourse_id.trim() !== "") {
        tarifQuery = tarifQuery.where("bourse_id", "==", bourse_id);
      }

      const tarifSnapshot = await tarifQuery.get();
      let tarif = null;
      if (!tarifSnapshot.empty) {
        tarif = tarifSnapshot.docs[0].data();
        tarif.id = tarifSnapshot.docs[0].id;
      }

      // Calculer le montant final avec réduction
      let montantFinal = tarif ? tarif.montant : 0;
      let reductions = tarif && tarif.reductions ? tarif.reductions : [];
      reductions.forEach((r) => {
        if (r.type === "bourse" || r.type === "remise") {
          montantFinal -= r.valeur;
        }
      });
      if (montantFinal < 0) montantFinal = 0;

      // Créer le nouvel étudiant
      const etudiantData = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        date_naissance: date_naissance,
        classe_id: classe_id,
        nationalite: nationalite.trim(),
        bourse_id: bourse_id && bourse_id.trim() !== "" ? bourse_id : null,
        exemptions: exemptions ? encrypt(JSON.stringify(exemptions)) : [], // Add exemptions, encrypt them
        parentId: parentId ? encrypt(parentId) : null, // Add parentId, encrypt it
        tarif_id: tarif ? tarif.id : null,
        montant_tarif: montantFinal,
        reductions: reductions,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (linkedUserId) {
        etudiantData.user_id = linkedUserId;
      }

      const docRef = await this.collection.add(etudiantData);
      const newEtudiant = await docRef.get();

      // Si on a lié un user, mettre à jour son role en 'etudiant'
      if (linkedUserId) {
        await db
          .collection("users")
          .doc(linkedUserId)
          .update({ role: "etudiant", updatedAt: new Date() });
      }

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "CREATE_ETUDIANT",
        entityType: "Etudiant",
        entityId: newEtudiant.id,
        details: { newEtudiantData: newEtudiant.data() },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("student.created", {
        studentId: newEtudiant.id,
        ...newEtudiant.data(),
      });

      return res.status(201).json({
        status: true,
        message: "Étudiant créé avec succès",
        data: {
          id: newEtudiant.id,
          ...newEtudiant.data(),
        },
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'étudiant:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur interne du serveur",
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
      const {
        page = 1,
        limit = 10,
        search,
        classe_id,
        bourse_id,
        nationalite,
      } = req.query;
      const pageNumber = parseInt(page);
      const limitNumber = parseInt(limit);

      let query = this.collection.orderBy("createdAt", "desc");

      // Filtres
      if (classe_id) {
        query = query.where("classe_id", "==", classe_id);
      }

      if (bourse_id) {
        query = query.where("bourse_id", "==", bourse_id);
      }

      if (nationalite) {
        query = query.where("nationalite", "==", nationalite);
      }

      // Recherche par nom ou prénom
      if (search && search.trim()) {
        const searchTerm = search.trim();
        // Note: Firestore ne supporte pas les recherches OR complexes
        // On utilise une approche simple avec le nom
        query = query
          .where("nom", ">=", searchTerm)
          .where("nom", "<=", searchTerm + "\uf8ff");
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
          const classeDoc = await db
            .collection("classes")
            .doc(etudiantData.classe_id)
            .get();
          if (classeDoc.exists) {
            classeInfo = { id: classeDoc.id, ...classeDoc.data() };
          }
        }

        // Récupérer les informations de la bourse
        let bourseInfo = null;
        if (etudiantData.bourse_id) {
          const bourseDoc = await db
            .collection("bourses")
            .doc(etudiantData.bourse_id)
            .get();
          if (bourseDoc.exists) {
            bourseInfo = { id: bourseDoc.id, ...bourseDoc.data() };
          }
        }

        // Decrypt sensitive fields
        if (etudiantData.exemptions && etudiantData.exemptions.length > 0) {
          try {
            etudiantData.exemptions = JSON.parse(
              decrypt(etudiantData.exemptions)
            );
          } catch (e) {
            console.error("Error decrypting exemptions for student", doc.id, e);
            etudiantData.exemptions = []; // Fallback to empty array on error
          }
        }
        if (etudiantData.parentId) {
          etudiantData.parentId = decrypt(etudiantData.parentId);
        }

        const currentYear = new Date().getFullYear();
        const paymentStatus = await this.getPaymentStatus(doc.id, currentYear);

        etudiants.push({
          id: doc.id,
          ...etudiantData,
          classe: classeInfo,
          bourse: bourseInfo,
          paymentStatus: paymentStatus, // Ajouter le statut de paiement
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
      console.error("Erreur lors de la récupération des étudiants:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la récupération des étudiants",
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
          message: "ID de l'étudiant requis",
        });
      }

      const etudiantDoc = await this.collection.doc(id).get();

      if (!etudiantDoc.exists) {
        return res.status(404).json({
          status: false,
          message: "Étudiant non trouvé",
        });
      }

      const etudiantData = etudiantDoc.data();

      // Récupérer les informations de la classe
      let classeInfo = null;
      if (etudiantData.classe_id) {
        const classeDoc = await db
          .collection("classes")
          .doc(etudiantData.classe_id)
          .get();
        if (classeDoc.exists) {
          classeInfo = { id: classeDoc.id, ...classeDoc.data() };
        }
      }

      // Récupérer les informations de la bourse
      let bourseInfo = null;
      if (etudiantData.bourse_id) {
        const bourseDoc = await db
          .collection("bourses")
          .doc(etudiantData.bourse_id)
          .get();
        if (bourseDoc.exists) {
          bourseInfo = { id: bourseDoc.id, ...bourseDoc.data() };
        }
      }

      // Récupérer le parent si disponible (après déchiffrement plus bas)
      let parentInfo = null;

      // Decrypt sensitive fields
      if (etudiantData.exemptions && etudiantData.exemptions.length > 0) {
        try {
          etudiantData.exemptions = JSON.parse(
            decrypt(etudiantData.exemptions)
          );
        } catch (e) {
          console.error("Error decrypting exemptions for student", id, e);
          etudiantData.exemptions = []; // Fallback to empty array on error
        }
      }
      if (etudiantData.parentId) {
        etudiantData.parentId = decrypt(etudiantData.parentId);
        try {
          const parentDoc = await db
            .collection("users")
            .doc(etudiantData.parentId)
            .get();
          if (parentDoc.exists) {
            parentInfo = { id: parentDoc.id, ...parentDoc.data() };
          }
        } catch (_) {
          // ignore parent fetch errors
        }
      }

      // Récupérer un éventuel tarif actif pour la classe (type Scolarité)
      let montantTarif = null;
      try {
        if (etudiantData.classe_id) {
          const tarifsSnap = await db
            .collection("tarifs")
            .where("classe_id", "==", etudiantData.classe_id)
            .where("isActive", "==", true)
            .where("type", "==", "Scolarité")
            .limit(1)
            .get();
          if (!tarifsSnap.empty) {
            const t = tarifsSnap.docs[0].data();
            if (typeof t.montant === "number") montantTarif = t.montant;
          }
        }
      } catch (_) {
        // ignore tarif lookup errors
      }

      // Récupérer les factures et paiements liés à cet étudiant
      const facturesSnapshot = await db
        .collection("factures")
        .where("student_id", "==", id)
        .get();
      const factures = facturesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const paiementsSnapshot = await this.paiementCollection
        .where("etudiant_id", "==", id)
        .get();
      const paiements = paiementsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Calculer un statut de paiement cohérent à partir des factures/paiements
      const totalMontantDu = factures.reduce((sum, f) => {
        const mt =
          typeof f.montant_total === "number"
            ? f.montant_total
            : Number(f.montant_total) || 0;
        return sum + mt;
      }, 0);

      const totalPayeFromInvoices = factures.reduce((sum, f) => {
        const mp =
          typeof f.montant_paye === "number"
            ? f.montant_paye
            : Number(f.montant_paye) || 0;
        return sum + mp;
      }, 0);

      const totalPayeFromPayments = paiements.reduce((sum, p) => {
        const mp =
          typeof p.montantPaye === "number"
            ? p.montantPaye
            : Number(p.montantPaye) || 0;
        return sum + mp;
      }, 0);

      const totalPaid =
        totalPayeFromInvoices > 0
          ? totalPayeFromInvoices
          : totalPayeFromPayments;
      const remainingAmount = Math.max(0, totalMontantDu - totalPaid);
      let paymentWarningStatus = "OK";
      if (remainingAmount <= 0) {
        paymentWarningStatus = "Payée";
      } else if (totalMontantDu > 0 && totalPaid / totalMontantDu < 0.5) {
        paymentWarningStatus = "Avertissement: 1er Semestre (50%) non atteint";
      }
      const paymentStatus = {
        totalMontantDu,
        totalPaid,
        remainingAmount,
        paymentWarningStatus,
      };

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
          factures,
          paiements,
          paymentStatus, // Statut de paiement calculé à partir des factures/paiements
          parent: parentInfo,
          montantTarif,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'étudiant:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la récupération de l'étudiant",
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
      const {
        nom,
        prenom,
        date_naissance,
        classe_id,
        nationalite,
        bourse_id,
        exemptions,
        parentId,
      } = req.body;

      if (!id) {
        return res.status(400).json({
          status: false,
          message: "ID de l'étudiant requis",
        });
      }

      // Vérifier si l'étudiant existe
      const etudiantRef = this.collection.doc(id);
      const etudiantDoc = await etudiantRef.get();

      if (!etudiantDoc.exists) {
        return res.status(404).json({
          status: false,
          message: "Étudiant non trouvé",
        });
      }

      const currentData = etudiantDoc.data();

      const oldEtudiantData = etudiantDoc.data(); // Get old data for audit log

      // Validation des données
      if (nom !== undefined && (!nom || nom.trim().length < 2)) {
        return res.status(400).json({
          status: false,
          message: "Le nom doit contenir au moins 2 caractères",
        });
      }

      if (prenom !== undefined && (!prenom || prenom.trim().length < 2)) {
        return res.status(400).json({
          status: false,
          message: "Le prénom doit contenir au moins 2 caractères",
        });
      }

      if (date_naissance !== undefined) {
        const birthDate = new Date(date_naissance);
        if (isNaN(birthDate.getTime())) {
          return res.status(400).json({
            status: false,
            message: "Format de date invalide",
          });
        }

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const moisDiff = today.getMonth() - birthDate.getMonth();
        if (
          moisDiff < 0 ||
          (moisDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
          age--;
        }

        if (age < 3 || age > 25) {
          return res.status(400).json({
            status: false,
            message: "L'âge doit être entre 3 et 25 ans",
          });
        }
      }

      // Vérifier que la classe existe si elle est mise à jour
      if (classe_id && classe_id !== currentData.classe_id) {
        const classeRef = db.collection("classes").doc(classe_id);
        const classeDoc = await classeRef.get();
        if (!classeDoc.exists) {
          return res.status(400).json({
            status: false,
            message: "La classe spécifiée n'existe pas",
          });
        }
      }

      // Vérifier que la bourse existe si elle est mise à jour
      if (bourse_id !== undefined && bourse_id !== currentData.bourse_id) {
        if (bourse_id) {
          const bourseRef = db.collection("bourses").doc(bourse_id);
          const bourseDoc = await bourseRef.get();
          if (!bourseDoc.exists) {
            return res.status(400).json({
              status: false,
              message: "La bourse spécifiée n'existe pas",
            });
          }
        }
      }

      // Vérifier l'unicité si le nom/prénom/date changent
      if (
        (nom && nom !== currentData.nom) ||
        (prenom && prenom !== currentData.prenom) ||
        (date_naissance && date_naissance !== currentData.date_naissance)
      ) {
        const searchNom = nom || currentData.nom;
        const searchPrenom = prenom || currentData.prenom;
        const searchDate = date_naissance || currentData.date_naissance;

        const existingStudent = await this.collection
          .where("nom", "==", searchNom.trim())
          .where("prenom", "==", searchPrenom.trim())
          .where("date_naissance", "==", searchDate)
          .get();

        // Vérifier qu'il n'y a pas d'autre étudiant avec ces informations
        const hasConflict = existingStudent.docs.some((doc) => doc.id !== id);
        if (hasConflict) {
          return res.status(409).json({
            status: false,
            message: "Un autre étudiant avec ces informations existe déjà",
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
      if (exemptions !== undefined) {
        updateData.exemptions = encrypt(JSON.stringify(exemptions));
      }
      if (parentId !== undefined) {
        updateData.parentId = encrypt(parentId);
      }

      // Mettre à jour l'étudiant
      await etudiantRef.update(updateData);

      // Récupérer l'étudiant mis à jour
      const updatedEtudiant = await etudiantRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "UPDATE_ETUDIANT",
        entityType: "Etudiant",
        entityId: id,
        details: { oldData: oldEtudiantData, newData: updatedEtudiant.data() },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("student.updated", {
        studentId: id,
        oldData: oldEtudiantData,
        newData: updatedEtudiant.data(),
      });

      return res.status(200).json({
        status: true,
        message: "Étudiant mis à jour avec succès",
        data: {
          id: updatedEtudiant.id,
          ...updatedEtudiant.data(),
        },
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'étudiant:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la mise à jour de l'étudiant",
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
          message: "ID de l'étudiant requis",
        });
      }

      // Vérifier si l'étudiant existe
      const etudiantRef = this.collection.doc(id);
      const etudiantDoc = await etudiantRef.get();

      if (!etudiantDoc.exists) {
        return res.status(404).json({
          status: false,
          message: "Étudiant non trouvé",
        });
      }

      const deletedEtudiantData = etudiantDoc.data(); // Get data before deletion for audit log

      // Vérifier si l'étudiant a des factures
      const facturesRef = db.collection("factures");
      const facturesSnapshot = await facturesRef
        .where("student_id", "==", id)
        .get();

      if (!facturesSnapshot.empty) {
        return res.status(400).json({
          status: false,
          message:
            "Impossible de supprimer cet étudiant car il a des factures associées",
        });
      }

      // Vérifier si l'étudiant a des échéanciers
      const echeanciersRef = db.collection("echeanciers");
      const echeanciersSnapshot = await echeanciersRef
        .where("student_id", "==", id)
        .get();

      if (!echeanciersSnapshot.empty) {
        return res.status(400).json({
          status: false,
          message:
            "Impossible de supprimer cet étudiant car il a des échéanciers associés",
        });
      }

      // Supprimer l'étudiant
      await etudiantRef.delete();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "DELETE_ETUDIANT",
        entityType: "Etudiant",
        entityId: id,
        details: { deletedEtudiantData },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("student.deleted", {
        studentId: id,
        deletedEtudiantData,
      });

      return res.status(200).json({
        status: true,
        message: "Étudiant supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'étudiant:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la suppression de l'étudiant",
        error: error.message,
      });
    }
  }

  // Nouvelle méthode pour calculer le statut d'avertissement de paiement
  async getPaymentStatus(studentId, currentYear) {
    const annualSchoolFees = 59000;
    const annualRegistrationFees = 1800;

    // Définir les dates limites des semestres (à ajuster selon le calendrier réel)
    const midSemester1Date = new Date(`${currentYear}-11-15`); // Ex: 15 Novembre
    const endSemester1Date = new Date(`${currentYear}-01-31`); // Ex: 31 Janvier de l'année suivante

    const today = new Date();

    const etudiantDoc = await this.collection.doc(studentId).get();
    if (!etudiantDoc.exists) {
      return {
        totalMontantDu: 0,
        totalPaid: 0,
        remainingAmount: 0,
        paymentWarningStatus: "Étudiant non trouvé",
      };
    }
    const etudiantData = etudiantDoc.data();

    // Calculate total amount due
    let totalMontantDu = annualSchoolFees + annualRegistrationFees;

    if (etudiantData.bourse_id) {
      const bourseDoc = await this.boursesCollection
        .doc(etudiantData.bourse_id)
        .get();
      if (bourseDoc.exists) {
        const bourseData = bourseDoc.data();
        totalMontantDu -= bourseData.montant; // Deduct scholarship
      }
    }

    // Calculate total paid for the current academic year
    // Tenter de récupérer les paiements pour l'année courante (format "YYYY")
    let paymentsSnapshot = await this.paiementCollection
      .where("etudiant_id", "==", studentId)
      .where("anneeScolaire", "==", currentYear.toString())
      .get();

    // Si aucun résultat, fallback sur formats d'année scolaire "YYYY-YYYY"
    if (paymentsSnapshot.empty) {
      const academicYear1 = `${currentYear - 1}-${currentYear}`; // ex: 2024-2025 si currentYear=2025
      const academicYear2 = `${currentYear}-${currentYear + 1}`; // ex: 2025-2026
      paymentsSnapshot = await this.paiementCollection
        .where("etudiant_id", "==", studentId)
        .where("anneeScolaire", "in", [academicYear1, academicYear2])
        .get()
        .catch(() => ({ empty: true, docs: [] }));
    }

    // Si toujours vide (index manquant ou format différent), ne filtre que par étudiant
    if (paymentsSnapshot.empty) {
      paymentsSnapshot = await this.paiementCollection
        .where("etudiant_id", "==", studentId)
        .get();
    }

    let totalPaid = 0;
    paymentsSnapshot.docs.forEach((doc) => {
      totalPaid += doc.data().montantPaye || 0;
    });

    const remainingAmount = totalMontantDu - totalPaid;

    let paymentWarningStatus = "OK";

    if (remainingAmount <= 0) {
      paymentWarningStatus = "Payée";
    } else if (today > endSemester1Date) {
      // After first semester ends, check if 50% paid
      if (totalPaid < totalMontantDu * 0.5) {
        paymentWarningStatus = "Avertissement: 1er Semestre (50%) non atteint";
      }
    } else if (today > midSemester1Date) {
      // After mid-semester, check if 30% paid
      if (totalPaid < totalMontantDu * 0.3) {
        paymentWarningStatus = "Avertissement: Mi-semestre (30%) non atteint";
      }
    }

    return {
      totalMontantDu,
      totalPaid,
      remainingAmount,
      paymentWarningStatus,
    };
  }

  /**
   * Rechercher des étudiants
   * GET /etudiants/search?q=terme
   */
  async search(req, res) {
    try {
      const { q, classe_id, nationalite } = req.query;

      if (!q || q.trim() === "") {
        return res.status(400).json({
          status: false,
          message: "Terme de recherche requis",
        });
      }

      const searchTerm = q.trim();
      let query = this.collection;

      // Recherche par nom ou prénom
      if (searchTerm.length >= 2) {
        query = query
          .where("nom", ">=", searchTerm)
          .where("nom", "<=", searchTerm + "\uf8ff");
      }

      // Filtres additionnels
      if (classe_id) {
        query = query.where("classe_id", "==", classe_id);
      }

      if (nationalite) {
        query = query.where("nationalite", "==", nationalite);
      }

      const snapshot = await query.limit(20).get();

      const etudiants = [];

      // Récupérer les données avec relations
      for (const doc of snapshot.docs) {
        const etudiantData = doc.data();

        // Récupérer les informations de la classe
        let classeInfo = null;
        if (etudiantData.classe_id) {
          const classeDoc = await db
            .collection("classes")
            .doc(etudiantData.classe_id)
            .get();
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
      console.error("Erreur lors de la recherche des étudiants:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la recherche des étudiants",
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
        query = query.where("classe_id", "==", classe_id);
      }

      if (nationalite) {
        query = query.where("nationalite", "==", nationalite);
      }

      const snapshot = await query.get();
      const etudiants = snapshot.docs.map((doc) => doc.data());

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

      etudiants.forEach((etudiant) => {
        // Statistiques par classe
        if (etudiant.classe_id) {
          stats.parClasse[etudiant.classe_id] =
            (stats.parClasse[etudiant.classe_id] || 0) + 1;
        }

        // Statistiques par nationalité
        if (etudiant.nationalite) {
          stats.parNationalite[etudiant.nationalite] =
            (stats.parNationalite[etudiant.nationalite] || 0) + 1;
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
      console.error("Erreur lors de la récupération des statistiques:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la récupération des statistiques",
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
          message: "ID de la classe requis",
        });
      }

      // Vérifier que la classe existe
      const classeRef = db.collection("classes").doc(classe_id);
      const classeDoc = await classeRef.get();
      if (!classeDoc.exists) {
        return res.status(404).json({
          status: false,
          message: "Classe non trouvée",
        });
      }

      // Récupérer les étudiants de cette classe
      const snapshot = await this.collection
        .where("classe_id", "==", classe_id)
        .orderBy("nom")
        .orderBy("prenom")
        .limit(limitNumber)
        .offset((pageNumber - 1) * limitNumber)
        .get();

      const etudiants = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Compter le total
      const totalSnapshot = await this.collection
        .where("classe_id", "==", classe_id)
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
      console.error(
        "Erreur lors de la récupération des étudiants par classe:",
        error
      );
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la récupération des étudiants par classe",
        error: error.message,
      });
    }
  }
}

module.exports = new EtudiantController();
