
const db = require("../../../config/firebase");
// Stripe supprimé
const paypal = require("@paypal/checkout-server-sdk"); // Installez le SDK PayPal
const AuditLog = require('../../../classes/AuditLog');
const Facture = require('../../../classes/Facture');
const { sendWebhook } = require('../../../utils/webhookSender');

class PaiementController {
  constructor() {
    this.collection = db.collection("paiements");
    this.factureCollection = db.collection("factures");
  }

  // Créer un paiement (Stripe ou PayPal)
  async create(req, res) {
    console.log("PaiementController: create method hit");
    try {
      const { montantPaye, methode, etudiant_id, facture_ids, justificatif_url, details } = req.body;

      if (!montantPaye || !methode || !etudiant_id || !facture_ids || facture_ids.length === 0) {
        return res
          .status(400)
          .json({ status: false, message: "Montant payé, méthode, ID étudiant et IDs facture sont requis." });
      }

      if (typeof montantPaye !== "number" || montantPaye <= 0) {
        return res.status(400).json({ status: false, message: "Le montant payé doit être un nombre positif." });
      }

      let paiementResult = {};
      if (methode === "paypal") {
        const env = new paypal.core.SandboxEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        );
        const client = new paypal.core.PayPalHttpClient(env);
        const request = new paypal.orders.OrdersCreateRequest();
        request.requestBody({
          intent: "CAPTURE",
          purchase_units: [
            { amount: { currency_code: "EUR", value: montantPaye.toString() } },
          ],
        });
        const order = await client.execute(request);
        paiementResult = {
          paypalOrderId: order.result.id,
          status: order.result.status,
        };
      } else {
        paiementResult = { status: "enregistré" };
      }

      // Enregistrement du paiement
      const paiementData = {
        etudiant_id,
        facture_ids,
        montantPaye: Number(montantPaye),
        mode: methode,
        justificatif_url: justificatif_url || null,
        details: details || {},
        status: paiementResult.status,
        external_id: paiementResult.paypalOrderId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const docRef = await this.collection.add(paiementData);
      const newPaiement = await docRef.get();

      // Mettre à jour les factures associées
      let totalPaidForInvoices = 0;
      const updatedInvoicesData = [];

      for (const factureId of facture_ids) {
        const factureRef = this.factureCollection.doc(factureId);
        const factureDoc = await factureRef.get();

        if (factureDoc.exists) {
          const oldFactureData = factureDoc.data();
          let currentMontantPaye = oldFactureData.montantPaye || 0;
          let currentMontantRestant = oldFactureData.montantRestant || oldFactureData.montant_total;

          const amountToApply = Math.min(montantPaye - totalPaidForInvoices, currentMontantRestant);

          if (amountToApply > 0) {
            currentMontantPaye += amountToApply;
            currentMontantRestant -= amountToApply;
            totalPaidForInvoices += amountToApply;

            let newStatut = 'impayée';
            if (currentMontantRestant <= 0) {
              newStatut = 'payée';
            } else if (currentMontantPaye > 0) {
              newStatut = 'partielle';
            }

            await factureRef.update({
              montantPaye: currentMontantPaye,
              montantRestant: currentMontantRestant,
              statut: newStatut,
              updatedAt: new Date(),
            });
            updatedInvoicesData.push({ id: factureId, oldData: oldFactureData, newData: (await factureRef.get()).data() });
          }
        }
      }

      // Audit log for payment creation
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'CREATE_PAIEMENT',
        entityType: 'Paiement',
        entityId: newPaiement.id,
        details: { newPaiementData: newPaiement.data(), updatedInvoices: updatedInvoicesData },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook('payment.succeeded', { paymentId: newPaiement.id, ...newPaiement.data(), updatedInvoices: updatedInvoicesData });

      return res.status(201).json({
        status: true,
        message: "Paiement créé avec succès",
        data: { id: newPaiement.id, ...newPaiement.data(), ...paiementResult },
      });
    } catch (error) {
      console.error("Erreur création paiement:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur serveur",
        error: error.message,
      });
    }
  }

  // Récupérer tous les paiements
  async getAll(req, res) {
    console.log("PaiementController: getAll method hit");
    try {
      const { etudiant_id, status } = req.query;
      console.log("PaiementController: getAll - Query parameters:", { etudiant_id, status });
      let query = this.collection;
      if (etudiant_id) {
        query = query.where("etudiant_id", "==", etudiant_id);
      }
      if (status) {
        query = query.where("status", "==", status);
      }
      const snapshot = await query.orderBy("createdAt", "desc").get();
      const paiements = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return res.status(200).json({ status: true, data: paiements });
    } catch (error) {
      return res
        .status(500)
        .json({
          status: false,
          message: "Erreur récupération paiements",
          error: error.message,
        });
    }
  }

  // Récupérer un paiement par ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Paiement non trouvé" });
      }
      return res
        .status(200)
        .json({ status: true, data: { id: doc.id, ...doc.data() } });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: "Erreur récupération paiement",
        error: error.message,
      });
    }
  }

  // Mettre à jour un paiement
  async update(req, res) {
    try {
      const { id } = req.params;
      const { montantPaye, status, details, facture_ids, justificatif_url } = req.body;
      const paiementRef = this.collection.doc(id);
      const paiementDoc = await paiementRef.get();
      if (!paiementDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Paiement non trouvé" });
      }

      const oldPaiementData = paiementDoc.data();
      const oldFactureIds = oldPaiementData.facture_ids || [];
      const oldMontantPaye = oldPaiementData.montantPaye || 0;

      const updateData = { updatedAt: new Date() };
      if (montantPaye !== undefined) updateData.montantPaye = Number(montantPaye);
      if (status !== undefined) updateData.status = status;
      if (details !== undefined) updateData.details = details;
      if (facture_ids !== undefined) updateData.facture_ids = facture_ids;
      if (justificatif_url !== undefined) updateData.justificatif_url = justificatif_url;

      await paiementRef.update(updateData);
      const updatedPaiement = await paiementRef.get();

      // Recalculate invoice balances based on old and new payment data
      const invoicesToUpdate = new Set([...oldFactureIds, ...facture_ids]);

      for (const factureId of invoicesToUpdate) {
        const factureRef = this.factureCollection.doc(factureId);
        const factureDoc = await factureRef.get();

        if (factureDoc.exists) {
          const factureData = factureDoc.data();
          let totalPaid = 0;

          // Sum all payments for this invoice
          const paymentsSnapshot = await this.collection.where("facture_ids", "array-contains", factureId).get();
          paymentsSnapshot.docs.forEach(paymentDoc => {
            if (paymentDoc.id === id) { // For the current payment being updated
              totalPaid += (updatedPaiement.data().montantPaye || 0);
            } else {
              totalPaid += (paymentDoc.data().montantPaye || 0);
            }
          });

          let newStatut = 'impayée';
          let montantRestant = factureData.montant_total - totalPaid;

          if (montantRestant <= 0) {
            newStatut = 'payée';
          } else if (totalPaid > 0) {
            newStatut = 'partielle';
          }

          await factureRef.update({
            montantPaye: totalPaid,
            montantRestant,
            statut: newStatut,
            updatedAt: new Date(),
          });
        }
      }

      // Audit log for payment update
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'UPDATE_PAIEMENT',
        entityType: 'Paiement',
        entityId: id,
        details: { oldData: oldPaiementData, newData: updatedPaiement.data(), affectedInvoices: Array.from(invoicesToUpdate) },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook('payment.updated', { paymentId: id, oldData: oldPaiementData, newData: updatedPaiement.data(), affectedInvoices: Array.from(invoicesToUpdate) });

      return res.status(200).json({
        status: true,
        message: "Paiement mis à jour",
        data: { id: updatedPaiement.id, ...updatedPaiement.data() },
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: "Erreur mise à jour paiement",
        error: error.message,
      });
    }
  }

  // Supprimer un paiement
  async delete(req, res) {
    try {
      const { id } = req.params;
      const paiementRef = this.collection.doc(id);
      const paiementDoc = await paiementRef.get();
      if (!paiementDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Paiement non trouvé" });
      }

      const deletedPaiementData = paiementDoc.data();
      const affectedFactureIds = deletedPaiementData.facture_ids || [];

      await paiementRef.delete();

      // Recalculate invoice balances for affected invoices
      for (const factureId of affectedFactureIds) {
        const factureRef = this.factureCollection.doc(factureId);
        const factureDoc = await factureRef.get();

        if (factureDoc.exists) {
          const factureData = factureDoc.data();
          let totalPaid = 0;

          // Sum all remaining payments for this invoice
          const paymentsSnapshot = await this.collection.where("facture_ids", "array-contains", factureId).get();
          paymentsSnapshot.docs.forEach(paymentDoc => {
            totalPaid += (paymentDoc.data().montantPaye || 0);
          });

          let newStatut = 'impayée';
          let montantRestant = factureData.montant_total - totalPaid;

          if (montantRestant <= 0) {
            newStatut = 'payée';
          } else if (totalPaid > 0) {
            newStatut = 'partielle';
          }

          await factureRef.update({
            montantPaye: totalPaid,
            montantRestant,
            statut: newStatut,
            updatedAt: new Date(),
          });
        }
      }

      // Audit log for payment deletion
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'DELETE_PAIEMENT',
        entityType: 'Paiement',
        entityId: id,
        details: { deletedPaiementData, affectedInvoices: affectedFactureIds },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook('payment.deleted', { paymentId: id, deletedPaiementData, affectedInvoices: affectedFactureIds });

      return res
        .status(200)
        .json({ status: true, message: "Paiement supprimé" });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: "Erreur suppression paiement",
        error: error.message,
      });
    }
  }

  async initiateDispute(req, res) {
    try {
      const { id } = req.params;
      const { disputeReason } = req.body;

      if (!id || !disputeReason) {
        return res.status(400).json({ status: false, message: "Payment ID and dispute reason are required." });
      }

      const paiementRef = this.collection.doc(id);
      const paiementDoc = await paiementRef.get();

      if (!paiementDoc.exists) {
        return res.status(404).json({ status: false, message: "Paiement non trouvé." });
      }

      const oldPaiementData = paiementDoc.data();

      if (oldPaiementData.disputeStatus !== 'none') {
        return res.status(400).json({ status: false, message: "Dispute already initiated or resolved for this payment." });
      }

      await paiementRef.update({
        disputeStatus: 'pending',
        disputeReason,
        updatedAt: new Date(),
      });

      const updatedPaiement = await paiementRef.get();

      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'INITIATE_DISPUTE',
        entityType: 'Paiement',
        entityId: id,
        details: { oldData: oldPaiementData, newData: updatedPaiement.data() },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook('payment.disputed', { paymentId: id, oldData: oldPaiementData, newData: updatedPaiement.data() });

      return res.status(200).json({ status: true, message: "Litige initié avec succès.", data: { id: updatedPaiement.id, ...updatedPaiement.data() } });

    } catch (error) {
      console.error("Error initiating dispute:", error);
      return res.status(500).json({ status: false, message: "Erreur lors de l'initiation du litige." });
    }
  }

  async resolveDispute(req, res) {
    try {
      const { id } = req.params;
      const { disputeStatus, resolutionDetails } = req.body;

      if (!id || !disputeStatus || !['resolved', 'rejected'].includes(disputeStatus)) {
        return res.status(400).json({ status: false, message: "Payment ID, dispute status (resolved/rejected) and resolution details are required." });
      }

      const paiementRef = this.collection.doc(id);
      const paiementDoc = await paiementRef.get();

      if (!paiementDoc.exists) {
        return res.status(404).json({ status: false, message: "Paiement non trouvé." });
      }

      const oldPaiementData = paiementDoc.data();

      if (oldPaiementData.disputeStatus !== 'pending') {
        return res.status(400).json({ status: false, message: "Cannot resolve dispute that is not pending." });
      }

      await paiementRef.update({
        disputeStatus,
        resolutionDetails,
        updatedAt: new Date(),
      });

      const updatedPaiement = await paiementRef.get();

      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'RESOLVE_DISPUTE',
        entityType: 'Paiement',
        entityId: id,
        details: { oldData: oldPaiementData, newData: updatedPaiement.data(), resolutionDetails },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook('payment.dispute_resolved', { paymentId: id, oldData: oldPaiementData, newData: updatedPaiement.data(), resolutionDetails });

      return res.status(200).json({ status: true, message: "Litige résolu avec succès.", data: { id: updatedPaiement.id, ...updatedPaiement.data() } });

    } catch (error) {
      console.error("Error resolving dispute:", error);
      return res.status(500).json({ status: false, message: "Erreur lors de la résolution du litige." });
    }
  }

  async initiateRefund(req, res) {
    try {
      const { id } = req.params;
      const { refundReason } = req.body;

      if (!id || !refundReason) {
        return res.status(400).json({ status: false, message: "Payment ID and refund reason are required." });
      }

      const paiementRef = this.collection.doc(id);
      const paiementDoc = await paiementRef.get();

      if (!paiementDoc.exists) {
        return res.status(404).json({ status: false, message: "Paiement non trouvé." });
      }

      const oldPaiementData = paiementDoc.data();

      if (oldPaiementData.refundStatus !== 'none') {
        return res.status(400).json({ status: false, message: "Refund already initiated or completed for this payment." });
      }

      await paiementRef.update({
        refundStatus: 'pending',
        refundReason,
        updatedAt: new Date(),
      });

      const updatedPaiement = await paiementRef.get();

      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'INITIATE_REFUND',
        entityType: 'Paiement',
        entityId: id,
        details: { oldData: oldPaiementData, newData: updatedPaiement.data() },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook('payment.refund_initiated', { paymentId: id, oldData: oldPaiementData, newData: updatedPaiement.data() });

      return res.status(200).json({ status: true, message: "Remboursement initié avec succès.", data: { id: updatedPaiement.id, ...updatedPaiement.data() } });

    } catch (error) {
      console.error("Error initiating refund:", error);
      return res.status(500).json({ status: false, message: "Erreur lors de l'initiation du remboursement." });
    }
  }

  async completeRefund(req, res) {
    try {
      const { id } = req.params;
      const { refundStatus, refundDetails } = req.body;

      if (!id || !refundStatus || !['completed', 'rejected'].includes(refundStatus)) {
        return res.status(400).json({ status: false, message: "Payment ID, refund status (completed/rejected) and refund details are required." });
      }

      const paiementRef = this.collection.doc(id);
      const paiementDoc = await paiementRef.get();

      if (!paiementDoc.exists) {
        return res.status(404).json({ status: false, message: "Paiement non trouvé." });
      }

      const oldPaiementData = paiementDoc.data();

      if (oldPaiementData.refundStatus !== 'pending') {
        return res.status(400).json({ status: false, message: "Cannot complete refund that is not pending." });
      }

      await paiementRef.update({
        refundStatus,
        refundDetails,
        updatedAt: new Date(),
      });

      const updatedPaiement = await paiementRef.get();

      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'COMPLETE_REFUND',
        entityType: 'Paiement',
        entityId: id,
        details: { oldData: oldPaiementData, newData: updatedPaiement.data(), refundDetails },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook('payment.refund_completed', { paymentId: id, oldData: oldPaiementData, newData: updatedPaiement.data(), refundDetails });

      return res.status(200).json({ status: true, message: "Remboursement complété avec succès.", data: { id: updatedPaiement.id, ...updatedPaiement.data() } });

    } catch (error) {
      console.error("Error completing refund:", error);
      return res.status(500).json({ status: false, message: "Erreur lors de la complétion du remboursement." });
    }
  }
}

module.exports = new PaiementController();
