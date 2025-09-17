// const Facture = require('../../../classes/Facture'); // eslint-disable-line no-unused-vars
const db = require("../../../config/firebase");
const AuditLog = require('../../../classes/AuditLog');
const { sendWebhook } = require('../../../utils/webhookSender');

class FactureController {
  constructor() {
    this.collection = db.collection("factures");
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

      if (!student_id || !montant_total || !statut || !items || items.length === 0) {
        return res.status(400).json({
          status: false,
          message: "L'étudiant, le montant total, le statut et les articles sont requis",
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
      if (typeof legalMentions !== "undefined") newFacture.legalMentions = legalMentions;
      if (typeof termsAndConditions !== "undefined") newFacture.termsAndConditions = termsAndConditions;
      if (typeof originalFactureId !== "undefined") newFacture.originalFactureId = originalFactureId;
      if (typeof reason !== "undefined") newFacture.reason = reason;
      if (typeof parentId !== "undefined") newFacture.parentId = parentId;
      if (typeof currency !== "undefined") newFacture.currency = currency;

      const docRef = await db.collection("factures").add(newFacture);
      const createdFacture = await docRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'CREATE_FACTURE',
        entityType: 'Facture',
        entityId: createdFacture.id,
        details: { newFactureData: createdFacture.data() },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook('invoice.created', { invoiceId: createdFacture.id, ...createdFacture.data() });

      return res
        .status(201)
        .json({ status: true, message: "Facture créée avec succès", data: { id: createdFacture.id, ...createdFacture.data() } });
    } catch (error) {
      console.error("Error in create facture:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la création de la facture",
      });
    }
  }

  async getAll(req, res) {
    try {
      // Si etudiant_id présent, déléguer à getByStudent
      if (req.query.etudiant_id) {
        req.params.student_id = req.query.etudiant_id;
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
        return res.status(400).json({ status: false, message: "ID de la facture requis" });
      }
      const factureDoc = await this.collection.doc(id).get();
      if (!factureDoc.exists) {
        return res.status(404).json({ status: false, message: "Facture non trouvée" });
      }
      return res.status(200).json({ status: true, data: { id: factureDoc.id, ...factureDoc.data() } });
    } catch (error) {
      console.error("Erreur getById facture:", error);
      return res.status(500).json({ status: false, message: "Erreur serveur" });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { student_id, date_emission, montant_total, statut, numero_facture, pdf_url, description, echeances, remises, logoUrl, legalMentions, termsAndConditions, items, originalFactureId, reason, parentId, currency } = req.body;

      if (!id) {
        return res.status(400).json({ status: false, message: "ID de la facture requis" });
      }

      const factureRef = this.collection.doc(id);
      const factureDoc = await factureRef.get();
      if (!factureDoc.exists) {
        return res.status(404).json({ status: false, message: "Facture non trouvée" });
      }

      const oldFactureData = factureDoc.data(); // For audit log

      const updateData = { updatedAt: new Date() };
      if (student_id !== undefined) updateData.student_id = student_id;
      if (date_emission !== undefined) updateData.date_emission = date_emission;
      if (montant_total !== undefined) updateData.montant_total = Number(montant_total);
      if (statut !== undefined) updateData.statut = statut;
      if (numero_facture !== undefined) updateData.numero_facture = numero_facture;
      if (pdf_url !== undefined) updateData.pdf_url = pdf_url;
      if (description !== undefined) updateData.description = description;
      if (echeances !== undefined) updateData.echeances = echeances;
      if (remises !== undefined) updateData.remises = remises;
      if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
      if (legalMentions !== undefined) updateData.legalMentions = legalMentions;
      if (termsAndConditions !== undefined) updateData.termsAndConditions = termsAndConditions;
      if (items !== undefined) updateData.items = Array.isArray(items) ? items : [];
      if (originalFactureId !== undefined) updateData.originalFactureId = originalFactureId;
      if (reason !== undefined) updateData.reason = reason;
      if (parentId !== undefined) updateData.parentId = parentId;
      if (currency !== undefined) updateData.currency = currency;

      await factureRef.update(updateData);
      const updatedFacture = await factureRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'UPDATE_FACTURE',
        entityType: 'Facture',
        entityId: id,
        details: { oldData: oldFactureData, newData: updatedFacture.data() },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook('invoice.updated', { invoiceId: id, oldData: oldFactureData, newData: updatedFacture.data() });

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
        return res.status(400).json({ status: false, message: "ID de la facture requis" });
      }

      const factureRef = this.collection.doc(id);
      const factureDoc = await factureRef.get();
      if (!factureDoc.exists) {
        return res.status(404).json({ status: false, message: "Facture non trouvée" });
      }

      const deletedFactureData = factureDoc.data(); // For audit log

      await factureRef.delete();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'DELETE_FACTURE',
        entityType: 'Facture',
        entityId: id,
        details: { deletedFactureData },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook('invoice.deleted', { invoiceId: id, deletedFactureData });

      return res.status(200).json({ status: true, message: "Facture supprimée avec succès" });
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
        return res.status(400).json({ status: false, message: "ID de la facture requis" });
      }
      if (!reason) {
        return res.status(400).json({ status: false, message: "Raison de l'annulation requise" });
      }

      const factureRef = this.collection.doc(id);
      const factureDoc = await factureRef.get();

      if (!factureDoc.exists) {
        return res.status(404).json({ status: false, message: "Facture non trouvée" });
      }

      const oldFactureData = factureDoc.data();

      if (oldFactureData.statut === 'annulée') {
        return res.status(400).json({ status: false, message: "Facture déjà annulée" });
      }

      await factureRef.update({
        statut: 'annulée',
        reason,
        updatedAt: new Date(),
      });

      const cancelledFacture = await factureRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'CANCEL_FACTURE',
        entityType: 'Facture',
        entityId: id,
        details: { oldData: oldFactureData, newData: cancelledFacture.data(), reason },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook('invoice.cancelled', { invoiceId: id, oldData: oldFactureData, newData: cancelledFacture.data(), reason });

      return res.status(200).json({ status: true, message: "Facture annulée avec succès", data: { id: cancelledFacture.id, ...cancelledFacture.data() } });

    } catch (error) {
      console.error("Erreur cancelling facture:", error);
      return res.status(500).json({ status: false, message: "Erreur serveur" });
    }
  }

  async createAvoir(req, res) {
    try {
      const { originalFactureId, reason, montant_total, items } = req.body;

      if (!originalFactureId || !reason || montant_total === undefined || !items || items.length === 0) {
        return res.status(400).json({ status: false, message: "Facture originale, raison, montant total et articles requis" });
      }

      const originalFactureDoc = await this.collection.doc(originalFactureId).get();
      if (!originalFactureDoc.exists) {
        return res.status(404).json({ status: false, message: "Facture originale non trouvée" });
      }

      const originalFactureData = originalFactureDoc.data();

      // Create the credit note (avoir)
      const newAvoir = {
        student_id: originalFactureData.student_id,
        date_emission: new Date(),
        montant_total: -Math.abs(Number(montant_total)), // Avoir should be negative
        statut: 'avoir',
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
        userId: req.user?.id || 'system',
        action: 'CREATE_AVOIR',
        entityType: 'Facture',
        entityId: createdAvoir.id,
        details: { originalFactureId, newAvoirData: createdAvoir.data(), reason },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook('invoice.created', { invoiceId: createdAvoir.id, ...createdAvoir.data(), originalFactureId, reason });

      return res.status(201).json({ status: true, message: "Avoir créé avec succès", data: { id: createdAvoir.id, ...createdAvoir.data() } });

    } catch (error) {
      console.error("Erreur creating avoir:", error);
      return res.status(500).json({ status: false, message: "Erreur serveur" });
    }
  }

  async createRectificativeFacture(req, res) {
    try {
      const { originalFactureId, reason, ...updatedFields } = req.body;

      if (!originalFactureId || !reason) {
        return res.status(400).json({ status: false, message: "Facture originale et raison requises" });
      }

      const originalFactureDoc = await this.collection.doc(originalFactureId).get();
      if (!originalFactureDoc.exists) {
        return res.status(404).json({ status: false, message: "Facture originale non trouvée" });
      }

      const originalFactureData = originalFactureDoc.data();

      // Create a new rectifying invoice (facture rectificative)
      const newRectificativeFacture = {
        ...originalFactureData,
        ...updatedFields,
        statut: 'rectificative',
        numero_facture: `RECT-${Date.now()}`,
        date_emission: new Date(),
        originalFactureId,
        reason,
        createdAt: new Date(), // New creation date for the rectifying invoice
        updatedAt: new Date(),
      };
      delete newRectificativeFacture.id; // Remove the old ID to let Firestore generate a new one

      const docRef = await db.collection("factures").add(newRectificativeFacture);
      const createdRectificativeFacture = await docRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'CREATE_RECTIFICATIVE_FACTURE',
        entityType: 'Facture',
        entityId: createdRectificativeFacture.id,
        details: { originalFactureId, newFactureData: createdRectificativeFacture.data(), reason },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook('invoice.created', { invoiceId: createdRectificativeFacture.id, ...createdRectificativeFacture.data(), originalFactureId, reason });

      return res.status(201).json({ status: true, message: "Facture rectificative créée avec succès", data: { id: createdRectificativeFacture.id, ...createdRectificativeFacture.data() } });

    } catch (error) {
      console.error("Erreur creating rectificative facture:", error);
      return res.status(500).json({ status: false, message: "Erreur serveur" });
    }
  }

  async createFamilyInvoice(req, res) {
    try {
      const { parentId, date_emission, logoUrl, legalMentions, termsAndConditions, currency } = req.body;

      if (!parentId) {
        return res.status(400).json({ status: false, message: "Parent ID is required" });
      }

      const studentsSnapshot = await db.collection("etudiants").where("parentId", "==", parentId).get();
      if (studentsSnapshot.empty) {
        return res.status(404).json({ status: false, message: "Aucun étudiant trouvé pour ce parent" });
      }

      let totalMontant = 0;
      let invoiceItems = [];
      const studentIds = studentsSnapshot.docs.map(doc => doc.id);

      // Fetch payments for each student (simplified for now, full logic later)
      for (const studentId of studentIds) {
        const studentDoc = await db.collection("etudiants").doc(studentId).get();
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
        return res.status(400).json({ status: false, message: "Aucun frais à facturer pour les étudiants de ce parent" });
      }

      const newFamilyFacture = {
        student_id: null, // This is a family invoice, not tied to a single student directly
        parentId,
        date_emission: date_emission || new Date(),
        montant_total: totalMontant,
        statut: 'impayée',
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
        userId: req.user?.id || 'system',
        action: 'CREATE_FAMILY_FACTURE',
        entityType: 'Facture',
        entityId: createdFamilyFacture.id,
        details: { parentId, newFactureData: createdFamilyFacture.data() },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook('invoice.created', { invoiceId: createdFamilyFacture.id, ...createdFamilyFacture.data(), parentId });

      return res.status(201).json({ status: true, message: "Facture familiale créée avec succès", data: { id: createdFamilyFacture.id, ...createdFamilyFacture.data() } });

    } catch (error) {
      console.error("Erreur creating family invoice:", error);
      return res.status(500).json({ status: false, message: "Erreur serveur" });
    }
  }

  async generatePdfInvoice(req, res) {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ status: false, message: "ID de la facture requis" });
        }

        const factureDoc = await this.collection.doc(id).get();
        if (!factureDoc.exists) {
            return res.status(404).json({ status: false, message: "Facture non trouvée" });
        }

        const factureData = factureDoc.data();

        const fileName = `facture-${factureData.numero_facture}.pdf`;

        const htmlContent = `
            <h1>Facture #${factureData.numero_facture}</h1>
            <p>Date: ${new Date(factureData.date_emission.toDate()).toLocaleDateString()}</p>
            <p>Montant Total: ${factureData.montant_total} ${factureData.currency}</p>
            <h2>Détails:</h2>
            <ul>
                ${factureData.items.map(item => `<li>${item.description} - ${item.quantity} x ${item.unitPrice} ${factureData.currency} = ${item.total} ${factureData.currency}</li>`).join('')}
            </ul>
            <p>Statut: ${factureData.statut}</p>
            ${factureData.logoUrl ? `<img src="${factureData.logoUrl}" alt="Logo" style="width: 100px;">` : ''}
            ${factureData.legalMentions ? `<p>${factureData.legalMentions}</p>` : ''}
            ${factureData.termsAndConditions ? `<p>${factureData.termsAndConditions}</p>` : ''}
        `;

        const { filePath, downloadUrl } = await require('../../../utils/pdfGenerator').generatePdf(htmlContent, fileName);

        // Record export history
        const exportHistory = new (require('../../../classes/ExportHistory'))({
            userId: req.user?.id || 'system',
            exportType: 'pdf',
            fileName: fileName,
            filePath: filePath,
            downloadUrl: downloadUrl,
        });
        await db.collection('exportHistory').add(exportHistory.toFirestore());

        return res.status(200).json({ status: true, message: "Facture PDF générée et archivée avec succès", downloadUrl: downloadUrl });

    } catch (error) {
        console.error("Error generating PDF invoice:", error);
        return res.status(500).json({ status: false, message: "Erreur lors de la génération de la facture PDF", error: error.message });
    }
  }
}

module.exports = new FactureController();
