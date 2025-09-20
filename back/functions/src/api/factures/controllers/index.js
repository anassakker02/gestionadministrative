// const Facture = require('../../../classes/Facture'); // eslint-disable-line no-unused-vars
const db = require("../../../config/firebase");
const AuditLog = require("../../../classes/AuditLog");
const { sendWebhook } = require("../../../utils/webhookSender");

class FactureController {
  constructor() {
    this.collection = db.collection("factures");
  }

  // Méthode utilitaire pour nettoyer les valeurs undefined pour Firestore
  cleanUndefinedValues(obj) {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.cleanUndefinedValues(item));
    } else if (obj && typeof obj === "object") {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined) {
          cleaned[key] = this.cleanUndefinedValues(value);
        }
      }
      return cleaned;
    }
    return obj;
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
        logoUrl,
        legalMentions,
        termsAndConditions,
        items,
        originalFactureId,
        reason,
        parentId,
        currency,
      } = req.body;

      if (
        !student_id ||
        !montant_total ||
        !statut ||
        !items ||
        items.length === 0
      ) {
        return res.status(400).json({
          status: false,
          message:
            "L'étudiant, le montant total, le statut et les articles sont requis",
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
        montantPaye: 0, // Initialiser à 0 pour une nouvelle facture
        montantRestant: montant_total, // Initialiser au montant total
        statut,
        items: Array.isArray(items) ? items : [],
        createdAt: new Date(),
      };
      if (typeof numero_facture !== "undefined")
        newFacture.numero_facture = numero_facture;
      if (typeof pdf_url !== "undefined") newFacture.pdf_url = pdf_url;
      if (typeof description !== "undefined")
        newFacture.description = description;
      if (typeof echeances !== "undefined") newFacture.echeances = echeances;
      if (typeof remises !== "undefined") newFacture.remises = remises;
      if (typeof logoUrl !== "undefined") newFacture.logoUrl = logoUrl;
      if (typeof legalMentions !== "undefined")
        newFacture.legalMentions = legalMentions;
      if (typeof termsAndConditions !== "undefined")
        newFacture.termsAndConditions = termsAndConditions;
      if (typeof originalFactureId !== "undefined")
        newFacture.originalFactureId = originalFactureId;
      if (typeof reason !== "undefined") newFacture.reason = reason;
      if (typeof parentId !== "undefined") newFacture.parentId = parentId;
      if (typeof currency !== "undefined") newFacture.currency = currency;

      const docRef = await db.collection("factures").add(newFacture);
      const createdFacture = await docRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "CREATE_FACTURE",
        entityType: "Facture",
        entityId: createdFacture.id,
        details: { newFactureData: createdFacture.data() },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("invoice.created", {
        invoiceId: createdFacture.id,
        ...createdFacture.data(),
      });

      return res.status(201).json({
        status: true,
        message: "Facture créée avec succès",
        data: { id: createdFacture.id, ...createdFacture.data() },
      });
    } catch (error) {
      console.error("Error in create facture:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la création de la facture",
      });
    }
  }

  // Générer une facture pour un étudiant en utilisant les tarifs (si disponibles)
  async generateForStudent(req, res) {
    try {
      const { student_id, items, description, currency } = req.body;
      if (!student_id) {
        return res
          .status(400)
          .json({ status: false, message: "student_id requis" });
      }

      // Récupérer l'étudiant (ou user si seed utilise user ids)
      const etuDoc = await db.collection("etudiants").doc(student_id).get();
      let studentData = null;
      if (etuDoc.exists) studentData = etuDoc.data();
      else {
        // try users
        const userDoc = await db.collection("users").doc(student_id).get();
        if (userDoc.exists) studentData = userDoc.data();
      }

      if (!studentData) {
        return res
          .status(404)
          .json({ status: false, message: "Étudiant / user non trouvé" });
      }

      // calculer montant_total: si items fournis, use items total; sinon try tarifs by classe
      let montant_total = 0;
      const invoiceItems = Array.isArray(items) && items.length ? items : [];
      if (invoiceItems.length > 0) {
        montant_total = invoiceItems.reduce(
          (acc, it) => acc + (Number(it.total) || 0),
          0
        );
      } else if (studentData.classe_id) {
        // chercher un tarif pour cette classe
        const tarifsSnap = await db
          .collection("tarifs")
          .where("classe_id", "==", studentData.classe_id)
          .limit(1)
          .get();
        if (!tarifsSnap.empty) {
          const tarif = tarifsSnap.docs[0].data();
          montant_total = Number(tarif.montant) || 0;
          // create a default item
          invoiceItems.push({
            description: tarif.description || "Frais scolarité",
            quantity: 1,
            unitPrice: montant_total,
            total: montant_total,
          });
        }
      }

      // Fallback minimal invoice
      if (montant_total === 0) montant_total = 0;

      const numero = `GEN-${student_id.slice(0, 6)}-${Date.now()
        .toString()
        .slice(-4)}`;
      const newFacture = {
        etudiant_id: student_id,
        student_id: student_id,
        parent_id: studentData.parentId || studentData.parent_id || null,
        date_emission: new Date(),
        montant_total,
        montantPaye: 0,
        montantRestant: montant_total,
        statut: montant_total > 0 ? "impayée" : "nulle",
        numero,
        numero_facture: numero,
        items: invoiceItems,
        currency: currency || "MAD",
        anneeScolaire: new Date().getFullYear().toString(),
        description: description || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await this.collection.add(newFacture);
      const created = await docRef.get();

      // audit + webhook
      const audit = new AuditLog({
        userId: req.user?.id || "system",
        action: "GENERATE_FACTURE",
        entityType: "Facture",
        entityId: created.id,
        details: { newFacture: created.data() },
      });
      await audit.save();
      await sendWebhook("invoice.generated", {
        invoiceId: created.id,
        ...created.data(),
      });

      return res.status(201).json({
        status: true,
        message: "Facture générée",
        data: { id: created.id, ...created.data() },
      });
    } catch (error) {
      console.error("Erreur generateForStudent:", error);
      return res.status(500).json({ status: false, message: "Erreur serveur" });
    }
  }

  async getAll(req, res) {
    try {
      // Si etudiant_id ou student_id présent, déléguer à getByStudent
      const sid = req.query.etudiant_id || req.query.student_id;
      if (sid) {
        req.params.student_id = sid;
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
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ status: false, message: "ID de la facture requis" });
      }
      const factureDoc = await this.collection.doc(id).get();
      if (!factureDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Facture non trouvée" });
      }
      return res.status(200).json({
        status: true,
        data: { id: factureDoc.id, ...factureDoc.data() },
      });
    } catch (error) {
      console.error("Erreur getById facture:", error);
      return res.status(500).json({ status: false, message: "Erreur serveur" });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
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
        logoUrl,
        legalMentions,
        termsAndConditions,
        items,
        originalFactureId,
        reason,
        parentId,
        currency,
      } = req.body;

      if (!id) {
        return res
          .status(400)
          .json({ status: false, message: "ID de la facture requis" });
      }

      const factureRef = this.collection.doc(id);
      const factureDoc = await factureRef.get();
      if (!factureDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Facture non trouvée" });
      }

      const oldFactureData = factureDoc.data(); // For audit log

      const updateData = { updatedAt: new Date() };
      if (student_id !== undefined) updateData.student_id = student_id;
      if (date_emission !== undefined) updateData.date_emission = date_emission;
      if (montant_total !== undefined)
        updateData.montant_total = Number(montant_total);
      if (statut !== undefined) updateData.statut = statut;
      if (numero_facture !== undefined)
        updateData.numero_facture = numero_facture;
      if (pdf_url !== undefined) updateData.pdf_url = pdf_url;
      if (description !== undefined) updateData.description = description;
      if (echeances !== undefined) updateData.echeances = echeances;
      if (remises !== undefined) updateData.remises = remises;
      if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
      if (legalMentions !== undefined) updateData.legalMentions = legalMentions;
      if (termsAndConditions !== undefined)
        updateData.termsAndConditions = termsAndConditions;
      if (items !== undefined)
        updateData.items = Array.isArray(items) ? items : [];
      if (originalFactureId !== undefined)
        updateData.originalFactureId = originalFactureId;
      if (reason !== undefined) updateData.reason = reason;
      if (parentId !== undefined) updateData.parentId = parentId;
      if (currency !== undefined) updateData.currency = currency;

      await factureRef.update(updateData);
      const updatedFacture = await factureRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "UPDATE_FACTURE",
        entityType: "Facture",
        entityId: id,
        details: { oldData: oldFactureData, newData: updatedFacture.data() },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("invoice.updated", {
        invoiceId: id,
        oldData: oldFactureData,
        newData: updatedFacture.data(),
      });

      return res.status(200).json({
        status: true,
        message: "Facture mise à jour avec succès",
        data: { id: updatedFacture.id, ...updatedFacture.data() },
      });
    } catch (error) {
      console.error("Erreur update facture:", error);
      return res.status(500).json({ status: false, message: "Erreur serveur" });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ status: false, message: "ID de la facture requis" });
      }

      const factureRef = this.collection.doc(id);
      const factureDoc = await factureRef.get();
      if (!factureDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Facture non trouvée" });
      }

      const deletedFactureData = factureDoc.data(); // For audit log

      await factureRef.delete();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "DELETE_FACTURE",
        entityType: "Facture",
        entityId: id,
        details: { deletedFactureData },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("invoice.deleted", {
        invoiceId: id,
        deletedFactureData,
      });

      return res
        .status(200)
        .json({ status: true, message: "Facture supprimée avec succès" });
    } catch (error) {
      console.error("Erreur delete facture:", error);
      return res.status(500).json({ status: false, message: "Erreur serveur" });
    }
  }

  async cancelFacture(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!id) {
        return res
          .status(400)
          .json({ status: false, message: "ID de la facture requis" });
      }
      if (!reason) {
        return res
          .status(400)
          .json({ status: false, message: "Raison de l'annulation requise" });
      }

      const factureRef = this.collection.doc(id);
      const factureDoc = await factureRef.get();

      if (!factureDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Facture non trouvée" });
      }

      const oldFactureData = factureDoc.data();

      if (oldFactureData.statut === "annulée") {
        return res
          .status(400)
          .json({ status: false, message: "Facture déjà annulée" });
      }

      await factureRef.update({
        statut: "annulée",
        reason,
        updatedAt: new Date(),
      });

      const cancelledFacture = await factureRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "CANCEL_FACTURE",
        entityType: "Facture",
        entityId: id,
        details: {
          oldData: oldFactureData,
          newData: cancelledFacture.data(),
          reason,
        },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("invoice.cancelled", {
        invoiceId: id,
        oldData: oldFactureData,
        newData: cancelledFacture.data(),
        reason,
      });

      return res.status(200).json({
        status: true,
        message: "Facture annulée avec succès",
        data: { id: cancelledFacture.id, ...cancelledFacture.data() },
      });
    } catch (error) {
      console.error("Erreur cancelling facture:", error);
      return res.status(500).json({ status: false, message: "Erreur serveur" });
    }
  }

  async createAvoir(req, res) {
    try {
      const { originalFactureId, reason, montant_total, items } = req.body;

      if (
        !originalFactureId ||
        !reason ||
        montant_total === undefined ||
        !items ||
        items.length === 0
      ) {
        return res.status(400).json({
          status: false,
          message:
            "Facture originale, raison, montant total et articles requis",
        });
      }

      const originalFactureDoc = await this.collection
        .doc(originalFactureId)
        .get();
      if (!originalFactureDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Facture originale non trouvée" });
      }

      const originalFactureData = originalFactureDoc.data();

      // Create the credit note (avoir)
      const newAvoir = {
        student_id: originalFactureData.student_id,
        date_emission: new Date(),
        montant_total: -Math.abs(Number(montant_total)), // Avoir should be negative
        statut: "avoir",
        numero_facture: `AVOIR-${Date.now()}`,
        pdf_url: null,
        logoUrl: originalFactureData.logoUrl,
        legalMentions: originalFactureData.legalMentions,
        termsAndConditions: originalFactureData.termsAndConditions,
        items,
        originalFactureId,
        reason,
        createdAt: new Date(),
      };

      const docRef = await db.collection("factures").add(newAvoir);
      const createdAvoir = await docRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "CREATE_AVOIR",
        entityType: "Facture",
        entityId: createdAvoir.id,
        details: {
          originalFactureId,
          newAvoirData: createdAvoir.data(),
          reason,
        },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("invoice.created", {
        invoiceId: createdAvoir.id,
        ...createdAvoir.data(),
        originalFactureId,
        reason,
      });

      return res.status(201).json({
        status: true,
        message: "Avoir créé avec succès",
        data: { id: createdAvoir.id, ...createdAvoir.data() },
      });
    } catch (error) {
      console.error("Erreur creating avoir:", error);
      return res.status(500).json({ status: false, message: "Erreur serveur" });
    }
  }

  async createRectificativeFacture(req, res) {
    try {
      const { originalFactureId, reason, ...updatedFields } = req.body;

      if (!originalFactureId || !reason) {
        return res.status(400).json({
          status: false,
          message: "Facture originale et raison requises",
        });
      }

      const originalFactureDoc = await this.collection
        .doc(originalFactureId)
        .get();
      if (!originalFactureDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Facture originale non trouvée" });
      }

      const originalFactureData = originalFactureDoc.data();

      // Create a new rectifying invoice (facture rectificative)
      const newRectificativeFacture = {
        ...originalFactureData,
        ...updatedFields,
        statut: "rectificative",
        numero_facture: `RECT-${Date.now()}`,
        date_emission: new Date(),
        originalFactureId,
        reason,
        createdAt: new Date(), // New creation date for the rectifying invoice
        updatedAt: new Date(),
      };
      delete newRectificativeFacture.id; // Remove the old ID to let Firestore generate a new one

      const docRef = await db
        .collection("factures")
        .add(newRectificativeFacture);
      const createdRectificativeFacture = await docRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "CREATE_RECTIFICATIVE_FACTURE",
        entityType: "Facture",
        entityId: createdRectificativeFacture.id,
        details: {
          originalFactureId,
          newFactureData: createdRectificativeFacture.data(),
          reason,
        },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("invoice.created", {
        invoiceId: createdRectificativeFacture.id,
        ...createdRectificativeFacture.data(),
        originalFactureId,
        reason,
      });

      return res.status(201).json({
        status: true,
        message: "Facture rectificative créée avec succès",
        data: {
          id: createdRectificativeFacture.id,
          ...createdRectificativeFacture.data(),
        },
      });
    } catch (error) {
      console.error("Erreur creating rectificative facture:", error);
      return res.status(500).json({ status: false, message: "Erreur serveur" });
    }
  }

  async createFamilyInvoice(req, res) {
    try {
      const {
        parentId,
        date_emission,
        logoUrl,
        legalMentions,
        termsAndConditions,
        currency,
      } = req.body;

      if (!parentId) {
        return res
          .status(400)
          .json({ status: false, message: "Parent ID is required" });
      }

      const studentsSnapshot = await db
        .collection("etudiants")
        .where("parentId", "==", parentId)
        .get();
      if (studentsSnapshot.empty) {
        return res.status(404).json({
          status: false,
          message: "Aucun étudiant trouvé pour ce parent",
        });
      }

      let totalMontant = 0;
      let invoiceItems = [];
      const studentIds = studentsSnapshot.docs.map((doc) => doc.id);

      // Fetch payments for each student (simplified for now, full logic later)
      for (const studentId of studentIds) {
        const studentDoc = await db
          .collection("etudiants")
          .doc(studentId)
          .get();
        const studentData = studentDoc.data();

        // Assuming each student has a 'montant_tarif' and we're billing for it
        if (studentData && studentData.montant_tarif) {
          totalMontant += studentData.montant_tarif;
          invoiceItems.push({
            description: `Frais de scolarité pour ${studentData.nom} ${studentData.prenom} (${studentData.annee_scolaire})`,
            quantity: 1,
            unitPrice: studentData.montant_tarif,
            total: studentData.montant_tarif,
            studentId: studentId,
          });
        }
      }

      if (invoiceItems.length === 0) {
        return res.status(400).json({
          status: false,
          message: "Aucun frais à facturer pour les étudiants de ce parent",
        });
      }

      const newFamilyFacture = {
        student_id: null, // This is a family invoice, not tied to a single student directly
        parentId,
        date_emission: date_emission || new Date(),
        montant_total: totalMontant,
        statut: "impayée",
        numero_facture: `FAM-${Date.now()}`,
        pdf_url: null,
        logoUrl: logoUrl || null,
        legalMentions: legalMentions || null,
        termsAndConditions: termsAndConditions || null,
        items: invoiceItems,
        currency: currency || "MAD",
        createdAt: new Date(),
      };

      const docRef = await db.collection("factures").add(newFamilyFacture);
      const createdFamilyFacture = await docRef.get();

      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "CREATE_FAMILY_FACTURE",
        entityType: "Facture",
        entityId: createdFamilyFacture.id,
        details: { parentId, newFactureData: createdFamilyFacture.data() },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("invoice.created", {
        invoiceId: createdFamilyFacture.id,
        ...createdFamilyFacture.data(),
        parentId,
      });

      return res.status(201).json({
        status: true,
        message: "Facture familiale créée avec succès",
        data: { id: createdFamilyFacture.id, ...createdFamilyFacture.data() },
      });
    } catch (error) {
      console.error("Erreur creating family invoice:", error);
      return res.status(500).json({ status: false, message: "Erreur serveur" });
    }
  }

  async generatePdfInvoice(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res
          .status(400)
          .json({ status: false, message: "ID de la facture requis" });
      }

      const factureDoc = await this.collection.doc(id).get();
      if (!factureDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Facture non trouvée" });
      }

      const factureData = factureDoc.data();

      const fileName = `facture-${factureData.numero_facture || id}.pdf`;

      const toDateSafe = (v) => {
        if (!v) return null;
        if (v && typeof v.toDate === "function") {
          try {
            return v.toDate();
          } catch (_) {}
        }
        if (typeof v === "string" || typeof v === "number") {
          const d = new Date(v);
          return isNaN(d.getTime()) ? null : d;
        }
        if (v && typeof v === "object" && (v.seconds || v._seconds)) {
          const s = v.seconds || v._seconds;
          return new Date(s * 1000);
        }
        return null;
      };

      const fmt = (n, c) => `${Number(n || 0).toLocaleString()} ${c || "MAD"}`;
      const dateEmission = toDateSafe(factureData.date_emission);
      const currency = factureData.currency || "MAD";

      // Préparer historiques de paiements (deux schémas possibles)
      const paymentHistory = Array.isArray(factureData.paymentHistory)
        ? factureData.paymentHistory
        : Array.isArray(factureData.historique_paiements)
        ? factureData.historique_paiements.map((p) => ({
            methode: p.mode_paiement || p.methode,
            date: p.date_paiement || p.date,
            enregistre_par: p.enregistre_par,
            montant: p.montant || p.montant_paye,
          }))
        : [];

      const paiementInfo = factureData.paiement_info || null;

      const itemsRows = (
        Array.isArray(factureData.items) ? factureData.items : []
      )
        .map(
          (item) => `
          <tr>
            <td>${item.description || "—"}</td>
            <td class="num">${item.quantity || 0}</td>
            <td class="num">${fmt(item.unitPrice, currency)}</td>
            <td class="num">${fmt(item.total, currency)}</td>
          </tr>`
        )
        .join("");

      const historySection =
        paymentHistory.length > 0
          ? `
        <h2>Historique des paiements</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Méthode</th>
              <th>Date</th>
              <th>Enregistré par</th>
              <th class="num">Montant</th>
            </tr>
          </thead>
          <tbody>
            ${paymentHistory
              .map(
                (ph) => `
              <tr>
                <td>${ph.methode || "—"}</td>
                <td>${(
                  toDateSafe(ph.date) || new Date()
                ).toLocaleDateString()}</td>
                <td>${ph.enregistre_par || "—"}</td>
                <td class="num">${fmt(ph.montant, currency)}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>`
          : "";

      const paiementInfoSection = paiementInfo
        ? `
        <h2>Informations de paiement</h2>
        <div class="grid">
          <div><strong>Mode:</strong> ${
            paiementInfo.mode_paiement || paiementInfo.methode || "—"
          }</div>
          <div><strong>Référence:</strong> ${
            paiementInfo.payment_id || paiementInfo.reference_externe || "—"
          }</div>
          <div><strong>Qui a payé:</strong> ${
            paiementInfo.qui_a_paye || "—"
          }</div>
          <div><strong>Enregistré par:</strong> ${
            paiementInfo.enregistre_par || "—"
          }</div>
          <div><strong>Date:</strong> ${(
            toDateSafe(paiementInfo.date_paiement) || new Date()
          ).toLocaleDateString()}</div>
        </div>`
        : "";

      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8"/>
            <style>
              body { font-family: Arial, sans-serif; font-size: 12px; }
              .header { display:flex; justify-content: space-between; align-items:center; }
              .muted { color:#666; }
              .grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:8px; }
              .table { width:100%; border-collapse: collapse; margin-top:8px; }
              .table th, .table td { border:1px solid #ddd; padding:6px; }
              .table th { background:#f7f7f7; text-align:left; }
              .num { text-align:right; white-space:nowrap; }
              .section { margin-top: 16px; }
              .total-box { margin-top:8px; padding:8px; border:1px solid #ddd; }
              img.logo { width:120px; height:auto; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Facture #${factureData.numero_facture || id}</h1>
              ${
                factureData.logoUrl
                  ? `<img class="logo" src="${factureData.logoUrl}" alt="Logo"/>`
                  : ""
              }
            </div>
            <div class="muted">Émise le: ${(
              dateEmission || new Date()
            ).toLocaleDateString()}</div>
            <div class="section">
              <h2>Détails</h2>
              <table class="table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qté</th>
                    <th class="num">Prix unitaire</th>
                    <th class="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsRows}
                </tbody>
              </table>
              <div class="total-box">
                <div><strong>Montant total:</strong> ${fmt(
                  factureData.montant_total,
                  currency
                )}</div>
                <div><strong>Payé:</strong> ${fmt(
                  factureData.montantPaye,
                  currency
                )}</div>
                <div><strong>Restant:</strong> ${fmt(
                  factureData.montantRestant,
                  currency
                )}</div>
                <div><strong>Statut:</strong> ${factureData.statut}</div>
              </div>
            </div>

            <div class="section">
              ${paiementInfoSection}
            </div>

            <div class="section">
              ${historySection}
            </div>

            ${
              factureData.legalMentions
                ? `<div class="section"><h2>Mentions légales</h2><div class="muted">${factureData.legalMentions}</div></div>`
                : ""
            }
            ${
              factureData.termsAndConditions
                ? `<div class="section"><h2>Conditions générales</h2><div class="muted">${factureData.termsAndConditions}</div></div>`
                : ""
            }
          </body>
        </html>`;

      try {
        const { filePath, downloadUrl } =
          await require("../../../utils/pdfGenerator").generatePdf(
            htmlContent,
            fileName
          );

        // Record export history
        const exportHistory = new (require("../../../classes/ExportHistory"))({
          userId: req.user?.id || "system",
          exportType: "pdf",
          fileName: fileName,
          filePath: filePath,
          downloadUrl: downloadUrl,
        });
        await db.collection("exportHistory").add(exportHistory.toFirestore());

        if (req.query && String(req.query.redirect) === "1") {
          return res.redirect(downloadUrl);
        }

        return res.status(200).json({
          status: true,
          message: "Facture PDF générée et archivée avec succès",
          downloadUrl: downloadUrl,
        });
      } catch (uploadErr) {
        console.error(
          "Error uploading PDF to Firebase Storage, falling back to data URL:",
          uploadErr
        );
        // Fallback: generate PDF buffer and return data URL to avoid storage dependency
        const pdfLib = require("html-pdf");
        await new Promise((resolve, reject) => {
          pdfLib.create(htmlContent, {}).toBuffer((err, buffer) => {
            if (err) return reject(err);
            const dataUrl = `data:application/pdf;base64,${buffer.toString(
              "base64"
            )}`;
            return res.status(200).json({
              status: true,
              message:
                "Facture PDF générée (fallback) sans stockage. Utilisation d'une data URL.",
              downloadUrl: dataUrl,
            });
          });
        });
      }
    } catch (error) {
      console.error("Error generating PDF invoice:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la génération de la facture PDF",
        error: error.message,
      });
    }
  }

  async generateAfterPayment(req, res) {
    try {
      const {
        student_id,
        parent_id,
        montant_paye,
        mode_paiement, // "PayPal", "Espèces", "Virement", "Carte bancaire"
        payment_id, // ID du paiement PayPal ou référence paiement manuel
        qui_a_paye, // Nom de la personne qui a payé (étudiant, parent, etc.)
        enregistre_par, // ID de l'utilisateur qui a enregistré le paiement (admin/sous-admin/comptable)
        reference_externe, // Référence externe (ex: transaction PayPal ID)
        tarif_items, // Array des items de tarification
      } = req.body;

      if (
        !student_id ||
        !montant_paye ||
        !mode_paiement ||
        !qui_a_paye ||
        !enregistre_par
      ) {
        return res.status(400).json({
          status: false,
          message:
            "Étudiant, montant payé, mode de paiement, qui a payé et enregistré par sont requis",
        });
      }

      // Récupérer les informations de l'étudiant
      const etudiantDoc = await db
        .collection("etudiants")
        .doc(student_id)
        .get();
      if (!etudiantDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Étudiant non trouvé" });
      }
      const etudiantData = etudiantDoc.data();

      // Récupérer les tarifs de l'étudiant
      let totalTarif = 0;
      let factureItems = [];

      if (tarif_items && tarif_items.length > 0) {
        factureItems = tarif_items;
        totalTarif = tarif_items.reduce((sum, item) => sum + item.total, 0);
      } else {
        // Récupérer automatiquement les tarifs selon la classe et nationalité
        const tarifsSnapshot = await db
          .collection("tarifs")
          .where("classe_id", "==", etudiantData.classe_id)
          .where("nationalite", "==", etudiantData.nationalite)
          .where("isActive", "==", true)
          .get();

        if (!tarifsSnapshot.empty) {
          tarifsSnapshot.docs.forEach((doc) => {
            const tarifData = doc.data();
            totalTarif += tarifData.montant;
            factureItems.push({
              description: `Frais de scolarité - ${tarifData.type}`,
              quantity: 1,
              unitPrice: tarifData.montant,
              total: tarifData.montant,
              tarif_id: doc.id,
            });
          });
        }
      }

      // Calculer le montant restant
      const montantRestant = Math.max(0, totalTarif - montant_paye);

      // Déterminer le statut de la facture
      let statut;
      if (montant_paye >= totalTarif) {
        statut = "payée";
      } else if (montant_paye > 0) {
        statut = "partielle";
      } else {
        statut = "impayée";
      }

      // Créer la facture
      const newFacture = {
        student_id,
        parent_id: parent_id || etudiantData.parent_id || null,
        date_emission: new Date(),
        montant_total: totalTarif,
        montantPaye: montant_paye,
        montantRestant,
        statut,
        numero_facture: `AUTO-${Date.now()}`,
        pdf_url: null,
        items: factureItems,
        currency: "MAD",

        // Informations de traçabilité du paiement
        paiement_info: {
          mode_paiement,
          payment_id,
          qui_a_paye,
          enregistre_par,
          reference_externe: reference_externe || null,
          date_paiement: new Date(),
          auto_generated: true,
        },

        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Nettoyer les valeurs undefined pour Firestore
      const cleanFacture = this.cleanUndefinedValues(newFacture);

      // Sauvegarder la facture
      const docRef = await this.collection.add(cleanFacture);
      const createdFacture = await docRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: enregistre_par,
        action: "GENERATE_FACTURE_AFTER_PAYMENT",
        entityType: "Facture",
        entityId: createdFacture.id,
        details: {
          student_id,
          montant_paye,
          mode_paiement,
          qui_a_paye,
          auto_generated: true,
          payment_info: newFacture.paiement_info,
        },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("invoice.auto_generated", {
        invoiceId: createdFacture.id,
        ...createdFacture.data(),
        trigger: "payment_received",
      });

      return res.status(201).json({
        status: true,
        message: "Facture générée automatiquement après paiement avec succès",
        data: { id: createdFacture.id, ...createdFacture.data() },
      });
    } catch (error) {
      console.error("Erreur génération automatique facture:", error);
      return res.status(500).json({ status: false, message: "Erreur serveur" });
    }
  }

  async recordManualPayment(req, res) {
    try {
      const {
        facture_id,
        montant_paye,
        qui_a_paye,
        mode_paiement,
        reference_externe,
        commentaires,
      } = req.body;

      if (!facture_id || !montant_paye || !qui_a_paye || !mode_paiement) {
        return res.status(400).json({
          status: false,
          message:
            "ID facture, montant payé, qui a payé et mode de paiement sont requis",
        });
      }

      // Récupérer la facture existante
      const factureRef = this.collection.doc(facture_id);
      const factureDoc = await factureRef.get();

      if (!factureDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Facture non trouvée" });
      }

      const factureData = factureDoc.data();
      const nouveauMontantPaye = (factureData.montantPaye || 0) + montant_paye;
      const nouveauMontantRestant = Math.max(
        0,
        factureData.montant_total - nouveauMontantPaye
      );

      // Déterminer le nouveau statut
      let nouveauStatut;
      if (nouveauMontantPaye >= factureData.montant_total) {
        nouveauStatut = "payée";
      } else if (nouveauMontantPaye > 0) {
        nouveauStatut = "partielle";
      } else {
        nouveauStatut = "impayée";
      }

      // Créer l'entrée de paiement
      const paiementEntry = {
        montant: montant_paye,
        qui_a_paye,
        mode_paiement,
        reference_externe: reference_externe || null,
        commentaires: commentaires || null,
        enregistre_par: req.user?.id || "system",
        date_paiement: new Date(),
      };

      // Nettoyer les valeurs undefined
      const cleanPaiementEntry = this.cleanUndefinedValues(paiementEntry);

      // Mettre à jour la facture
      const updatedData = {
        montantPaye: nouveauMontantPaye,
        montantRestant: nouveauMontantRestant,
        statut: nouveauStatut,
        updatedAt: new Date(),
      };

      // Ajouter le paiement à l'historique
      if (!factureData.historique_paiements) {
        updatedData.historique_paiements = [cleanPaiementEntry];
      } else {
        updatedData.historique_paiements = [
          ...factureData.historique_paiements,
          cleanPaiementEntry,
        ];
      }

      await factureRef.update(updatedData);
      const updatedFacture = await factureRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "RECORD_MANUAL_PAYMENT",
        entityType: "Facture",
        entityId: facture_id,
        details: {
          paiementEntry: cleanPaiementEntry,
          oldMontantPaye: factureData.montantPaye || 0,
          newMontantPaye: nouveauMontantPaye,
          oldStatut: factureData.statut,
          newStatut: nouveauStatut,
        },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("invoice.payment_recorded", {
        invoiceId: facture_id,
        paiementEntry: cleanPaiementEntry,
        newData: updatedFacture.data(),
      });

      return res.status(200).json({
        status: true,
        message: "Paiement manuel enregistré avec succès",
        data: { id: updatedFacture.id, ...updatedFacture.data() },
      });
    } catch (error) {
      console.error("Erreur enregistrement paiement manuel:", error);
      return res.status(500).json({ status: false, message: "Erreur serveur" });
    }
  }
}

module.exports = new FactureController();
