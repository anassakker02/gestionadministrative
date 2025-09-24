const db = require("../../../config/firebase");
// Stripe supprimé
const paypal = require("@paypal/checkout-server-sdk"); // Installez le SDK PayPal
const AuditLog = require("../../../classes/AuditLog");
const { sendWebhook } = require("../../../utils/webhookSender");
const FactureController = require("../../factures/controllers");

class PaiementController {
  constructor() {
    this.collection = db.collection("paiements");
    this.factureCollection = db.collection("factures");
    this.etudiantCollection = db.collection("etudiants"); // Ajoutez la collection étudiants
    this.userCollection = db.collection("users"); // Ajoutez la collection utilisateurs pour les parents
  }

  // Créer un paiement (Stripe ou PayPal)
  async create(req, res) {
    console.log("PaiementController: create method hit");
    try {
      let {
        montantPaye,
        methode,
        etudiant_id,
        facture_ids,
        justificatif_url,
        details,
      } = req.body;

      if (!montantPaye || !methode || !etudiant_id) {
        // Si des facture_ids sont fournis, vérifier que le montant payé ne dépasse pas le montant restant total
        return res.status(400).json({
          status: false,
          message: "Montant payé, méthode et ID étudiant sont requis.",
        });
      }

      if (typeof montantPaye !== "number" || montantPaye <= 0) {
        return res.status(400).json({
          status: false,
          message: "Le montant payé doit être un nombre positif.",
        });
      }

      // Récupérer l'étudiant pour validation des plafonds (avant toute écriture)
      const etudiantDocForCap = await this.etudiantCollection
        .doc(etudiant_id)
        .get();
      if (!etudiantDocForCap.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Étudiant non trouvé." });
      }
      const etudiantDataForCap = etudiantDocForCap.data();

      // Calculer le plafond: somme des tarifs actifs (Scolarité + Autres frais) pour la classe et année, ajusté par bourse (pourcentage_remise)
      let tuitionAmount = 0;
      let otherFeesAmount = 0;
      try {
        // trouver année scolaire courante depuis un tarif actif quelconque ou fallback année courante
        const classId = etudiantDataForCap?.classe_id;
        const anneeScolaireCurrent = new Date().getFullYear().toString();
        if (classId) {
          // Scolarité
          const tuitionSnap = await db
            .collection("tarifs")
            .where("classe_id", "==", classId)
            .where("annee_scolaire", "==", anneeScolaireCurrent)
            .where("type", "==", "Scolarité")
            .where("isActive", "==", true)
            .limit(1)
            .get();
          if (!tuitionSnap.empty)
            tuitionAmount = Number(tuitionSnap.docs[0].data().montant) || 0;
          // Autres frais
          const otherSnap = await db
            .collection("tarifs")
            .where("classe_id", "==", classId)
            .where("annee_scolaire", "==", anneeScolaireCurrent)
            .where("type", "==", "Autres frais")
            .where("isActive", "==", true)
            .limit(1)
            .get();
          if (!otherSnap.empty)
            otherFeesAmount = Number(otherSnap.docs[0].data().montant) || 0;
        }
      } catch (e) {
        console.warn(
          "Tarifs lookup failed, fallback to defaults 56000/800",
          e?.message
        );
      }
      if (!tuitionAmount) tuitionAmount = 56000;
      if (!otherFeesAmount) otherFeesAmount = 800;
      let totalCap = tuitionAmount + otherFeesAmount;
      // appliquer bourse si présente (pourcentage_remise sur la scolarité uniquement, sinon sur total si besoin)
      try {
        const bourseId = etudiantDataForCap?.bourse_id;
        if (bourseId) {
          const bourseDoc = await db.collection("bourses").doc(bourseId).get();
          if (bourseDoc.exists) {
            const pr = Number(bourseDoc.data()?.pourcentage_remise) || 0;
            if (pr > 0) {
              // réduction sur la scolarité
              const tuitionAfter = Math.max(0, tuitionAmount * (1 - pr / 100));
              totalCap = tuitionAfter + otherFeesAmount;
            }
          }
        }
      } catch (e) {
        console.warn("Bourse lookup failed", e?.message);
      }

      // Calculer total déjà payé par l'étudiant
      const existingPaymentsSnap = await this.collection
        .where("etudiant_id", "==", etudiant_id)
        .get();
      const totalAlreadyPaid = existingPaymentsSnap.docs.reduce((acc, d) => {
        const data = d.data();
        const v = Number(data.montantPaye) || 0;
        return acc + v;
      }, 0);

      // Refuser si le paiement courant dépasse le plafond
      if (totalAlreadyPaid + Number(montantPaye) > totalCap + 1e-6) {
        return res.status(400).json({
          status: false,
          message: `Paiement refusé: dépasse le plafond autorisé (${totalCap} MAD). Déjà payé: ${totalAlreadyPaid} MAD, montant saisi: ${montantPaye} MAD`,
        });
      }
      const anneeScolaireCurrent = new Date().getFullYear().toString();
      const montant_du = Number(totalCap);
      const montant_payee = Number(montantPaye);
      const montant_restant = Math.max(
        0,
        montant_du - (totalAlreadyPaid + montant_payee)
      );

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
      // Politique: toujours stocker l'ID de l'étudiant dans `qui_a_paye` (afin de résoudre le nom par l'id étudiant).
      // Nous conservons en plus l'acteur réel dans `payer_user_id` (parent/élève/admin) pour l'audit.
      const qui_a_paye = etudiant_id; // toujours l'id de l'étudiant
      const payer_user_id =
        req.body?.qui_a_paye || req.body?.payer_id || req.user?.id || null; // acteur réel si fourni
      const enregistre_par =
        req.body?.enregistre_par || req.user?.id || "system";

      const paiementData = {
        etudiant_id,
        facture_ids,
        montantPaye: Number(montantPaye),
        mode: methode,
        justificatif_url: justificatif_url || null,
        details: details || {},
        status: paiementResult.status,
        external_id: paiementResult.paypalOrderId || null,
        qui_a_paye,
        payer_user_id,
        enregistre_par,
        recordedBy_user_id: req.user?.id || "system", // backward-compatible field
        // Champs trio annuels pour ce paiement
        montant_du,
        montant_payee,
        montant_restant,
        annee_scolaire: anneeScolaireCurrent,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const docRef = await this.collection.add(paiementData);
      const newPaiement = await docRef.get();

      // Mettre à jour les factures associées (ou générer une nouvelle facture si aucune n'est fournie)
      let generatedFactureId = null;

      // Always generate a new invoice after a payment
      // The generateAfterPayment method will handle cumulative totals on the invoice and student's paymentStatus
      const factureGenerationResult =
        await FactureController.generateAfterPayment({
          body: {
            student_id: etudiant_id,
            montant_paye: Number(montantPaye),
            mode_paiement: methode,
            qui_a_paye: qui_a_paye,
            enregistre_par: enregistre_par,
            reference_externe: paiementResult.paypalOrderId || null,
          },
          user: req.user, // Pass the current user for 'imprimé par'
        });

      if (factureGenerationResult.status && factureGenerationResult.data?.id) {
        generatedFactureId = factureGenerationResult.data.id;
        // Update the payment document with the ID of the newly generated invoice
        await docRef.update({ facture_ids: [generatedFactureId] });
      } else {
        console.error(
          "Facture auto-generation failed:",
          factureGenerationResult.message
        );
        // Handle error or fallback if invoice generation fails
      }

      // Audit log for payment creation
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "CREATE_PAIEMENT",
        entityType: "Paiement",
        entityId: newPaiement.id,
        details: {
          newPaiementData: newPaiement.data(),
          generatedFactureId: generatedFactureId,
        },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("payment.succeeded", {
        paymentId: newPaiement.id,
        ...newPaiement.data(),
        generatedFactureId: generatedFactureId,
      });

      return res.status(201).json({
        status: true,
        message: "Paiement créé avec succès",
        data: {
          id: newPaiement.id,
          ...newPaiement.data(),
          ...paiementResult,
          generatedFactureId,
        },
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
      // Supporter etudiant_id (clé actuelle en base) et student_id (alias documenté)
      const etuFromQuery = req.query.etudiant_id || req.query.student_id;
      const { status } = req.query;
      console.log("PaiementController: getAll - Query parameters:", {
        etudiant_id: etuFromQuery,
        status,
      });
      let query = this.collection;
      if (etuFromQuery) {
        query = query.where("etudiant_id", "==", etuFromQuery);
      }
      if (status) {
        query = query.where("status", "==", status);
      }
      // Essayer avec orderBy si possible
      let snapshot;
      try {
        snapshot = await query.orderBy("createdAt", "desc").get();
      } catch (e) {
        console.warn(
          "PaiementController: getAll - orderBy failed, retrying without orderBy:",
          e?.message
        );
        snapshot = await query.get();
      }
      let paiements = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log(
        `PaiementController: getAll - fetched ${paiements.length} paiements (by etudiant_id)`
      );

      // Fallback: si on filtre par étudiant et aucun résultat, tenter qui_a_paye
      if (etuFromQuery && paiements.length === 0) {
        let q2 = this.collection.where("qui_a_paye", "==", etuFromQuery);
        if (status) q2 = q2.where("status", "==", status);
        let snap2;
        try {
          snap2 = await q2.orderBy("createdAt", "desc").get();
        } catch (e2) {
          snap2 = await q2.get();
        }
        const alt = snap2.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        if (alt.length > 0) {
          console.log(
            `PaiementController: getAll - fallback qui_a_paye returned ${alt.length}`
          );
          paiements = alt;
        }
      }
      return res.status(200).json({ status: true, data: paiements });
    } catch (error) {
      return res.status(500).json({
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
      const {
        montantPaye,
        status,
        details,
        facture_ids,
        justificatif_url,
        qui_a_paye,
        payer_user_id,
      } = req.body;
      const paiementRef = this.collection.doc(id);
      const paiementDoc = await paiementRef.get();
      if (!paiementDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Paiement non trouvé" });
      }

      const oldPaiementData = paiementDoc.data();
      const oldFactureIds = oldPaiementData.facture_ids || [];

      const updateData = { updatedAt: new Date() };
      if (montantPaye !== undefined)
        updateData.montantPaye = Number(montantPaye);
      if (status !== undefined) updateData.status = status;
      if (details !== undefined) updateData.details = details;
      if (facture_ids !== undefined) updateData.facture_ids = facture_ids;
      if (justificatif_url !== undefined)
        updateData.justificatif_url = justificatif_url;
      if (qui_a_paye !== undefined) updateData.qui_a_paye = qui_a_paye;
      if (payer_user_id !== undefined) updateData.payer_user_id = payer_user_id;

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
          const paymentsSnapshot = await this.collection
            .where("facture_ids", "array-contains", factureId)
            .get();
          paymentsSnapshot.docs.forEach((paymentDoc) => {
            if (paymentDoc.id === id) {
              // For the current payment being updated
              totalPaid += updatedPaiement.data().montantPaye || 0;
            } else {
              totalPaid += paymentDoc.data().montantPaye || 0;
            }
          });

          let newStatut = "impayée";
          let montantRestant = factureData.montant_total - totalPaid;

          if (montantRestant <= 0) {
            newStatut = "payée";
          } else if (totalPaid > 0) {
            newStatut = "partielle";
          }

          await factureRef.update({
            montantPaye: totalPaid,
            montantRestant,
            statut: newStatut,
            updatedAt: new Date(),
          });
        }
      }

      // Recalculer et mettre à jour le triplet (montant_du, montant_payee, montant_restant) sur ce paiement après modification
      try {
        const pData = (await paiementRef.get()).data() || {};
        const etudiantIdForCap = pData.etudiant_id;
        if (etudiantIdForCap) {
          // recalculer le plafond annuel et le total déjà payé (hors ce paiement puis incluant)
          const etuDoc = await this.etudiantCollection
            .doc(etudiantIdForCap)
            .get();
          if (etuDoc.exists) {
            // Calcule plafond identique à create()
            let tuitionAmount = 0;
            let otherFeesAmount = 0;
            try {
              const classId = etuDoc.data()?.classe_id;
              const anneeScolaireCurrent = new Date().getFullYear().toString();
              if (classId) {
                const tuitionSnap = await db
                  .collection("tarifs")
                  .where("classe_id", "==", classId)
                  .where("annee_scolaire", "==", anneeScolaireCurrent)
                  .where("type", "==", "Scolarité")
                  .where("isActive", "==", true)
                  .limit(1)
                  .get();
                if (!tuitionSnap.empty)
                  tuitionAmount =
                    Number(tuitionSnap.docs[0].data().montant) || 0;
                const otherSnap = await db
                  .collection("tarifs")
                  .where("classe_id", "==", classId)
                  .where("annee_scolaire", "==", anneeScolaireCurrent)
                  .where("type", "==", "Autres frais")
                  .where("isActive", "==", true)
                  .limit(1)
                  .get();
                if (!otherSnap.empty)
                  otherFeesAmount =
                    Number(otherSnap.docs[0].data().montant) || 0;
              }
            } catch {}
            if (!tuitionAmount) tuitionAmount = 56000;
            if (!otherFeesAmount) otherFeesAmount = 800;
            let totalCap = tuitionAmount + otherFeesAmount;
            try {
              const bourseId = etuDoc.data()?.bourse_id;
              if (bourseId) {
                const bourseDoc = await db
                  .collection("bourses")
                  .doc(bourseId)
                  .get();
                if (bourseDoc.exists) {
                  const pr = Number(bourseDoc.data()?.pourcentage_remise) || 0;
                  if (pr > 0) {
                    const tuitionAfter = Math.max(
                      0,
                      tuitionAmount * (1 - pr / 100)
                    );
                    totalCap = tuitionAfter + otherFeesAmount;
                  }
                }
              }
            } catch {}

            // total déjà payé par l'étudiant (somme de tous paiements)
            const allPaymentsSnap = await this.collection
              .where("etudiant_id", "==", etudiantIdForCap)
              .get();
            const totalPaidAll = allPaymentsSnap.docs.reduce((acc, d) => {
              const v = Number(d.data().montantPaye) || 0;
              return acc + v;
            }, 0);
            // Pour ce paiement, considérer son montant actuel
            const montantPayeeCurrent =
              Number((await paiementRef.get()).data()?.montantPaye) || 0;
            const montantRestant = Math.max(0, Number(totalCap) - totalPaidAll);
            await paiementRef.update({
              montant_du: Number(totalCap),
              montant_payee: montantPayeeCurrent,
              montant_restant: montantRestant,
            });
          }
        }
      } catch (e) {
        console.warn(
          "Paiement update: recalcul des montants échoué:",
          e?.message
        );
      }

      // Audit log for payment update
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "UPDATE_PAIEMENT",
        entityType: "Paiement",
        entityId: id,
        details: {
          oldData: oldPaiementData,
          newData: updatedPaiement.data(),
          affectedInvoices: Array.from(invoicesToUpdate),
        },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("payment.updated", {
        paymentId: id,
        oldData: oldPaiementData,
        newData: updatedPaiement.data(),
        affectedInvoices: Array.from(invoicesToUpdate),
      });

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

      // Recalculer les soldes des factures impactées
      for (const factureId of affectedFactureIds) {
        const factureRef = this.factureCollection.doc(factureId);
        const factureDoc = await factureRef.get();

        if (factureDoc.exists) {
          const factureData = factureDoc.data();
          let totalPaid = 0;

          // Somme des paiements restants pour cette facture
          const paymentsSnapshot = await this.collection
            .where("facture_ids", "array-contains", factureId)
            .get();
          paymentsSnapshot.docs.forEach((paymentDoc) => {
            totalPaid += paymentDoc.data().montantPaye || 0;
          });

          let newStatut = "impayée";
          let montantRestant = (factureData.montant_total || 0) - totalPaid;

          if (montantRestant <= 0) {
            newStatut = "payée";
            montantRestant = 0;
          } else if (totalPaid > 0) {
            newStatut = "partielle";
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
        userId: req.user?.id || "system",
        action: "DELETE_PAIEMENT",
        entityType: "Paiement",
        entityId: id,
        details: { deletedPaiementData, affectedInvoices: affectedFactureIds },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("payment.deleted", {
        paymentId: id,
        deletedPaiementData,
        affectedInvoices: affectedFactureIds,
      });

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
        return res.status(400).json({
          status: false,
          message: "Payment ID and dispute reason are required.",
        });
      }

      const paiementRef = this.collection.doc(id);
      const paiementDoc = await paiementRef.get();

      if (!paiementDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Paiement non trouvé." });
      }

      const oldPaiementData = paiementDoc.data();

      if (oldPaiementData.disputeStatus !== "none") {
        return res.status(400).json({
          status: false,
          message: "Dispute already initiated or resolved for this payment.",
        });
      }

      await paiementRef.update({
        disputeStatus: "pending",
        disputeReason,
        updatedAt: new Date(),
      });

      const updatedPaiement = await paiementRef.get();

      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "INITIATE_DISPUTE",
        entityType: "Paiement",
        entityId: id,
        details: { oldData: oldPaiementData, newData: updatedPaiement.data() },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("payment.disputed", {
        paymentId: id,
        oldData: oldPaiementData,
        newData: updatedPaiement.data(),
      });

      return res.status(200).json({
        status: true,
        message: "Litige initié avec succès.",
        data: { id: updatedPaiement.id, ...updatedPaiement.data() },
      });
    } catch (error) {
      console.error("Error initiating dispute:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de l'initiation du litige.",
      });
    }
  }

  async resolveDispute(req, res) {
    try {
      const { id } = req.params;
      const { disputeStatus, resolutionDetails } = req.body;

      if (
        !id ||
        !disputeStatus ||
        !["resolved", "rejected"].includes(disputeStatus)
      ) {
        return res.status(400).json({
          status: false,
          message:
            "Payment ID, dispute status (resolved/rejected) and resolution details are required.",
        });
      }

      const paiementRef = this.collection.doc(id);
      const paiementDoc = await paiementRef.get();

      if (!paiementDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Paiement non trouvé." });
      }

      const oldPaiementData = paiementDoc.data();

      if (oldPaiementData.disputeStatus !== "pending") {
        return res.status(400).json({
          status: false,
          message: "Cannot resolve dispute that is not pending.",
        });
      }

      await paiementRef.update({
        disputeStatus,
        resolutionDetails,
        updatedAt: new Date(),
      });

      const updatedPaiement = await paiementRef.get();

      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "RESOLVE_DISPUTE",
        entityType: "Paiement",
        entityId: id,
        details: {
          oldData: oldPaiementData,
          newData: updatedPaiement.data(),
          resolutionDetails,
        },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("payment.dispute_resolved", {
        paymentId: id,
        oldData: oldPaiementData,
        newData: updatedPaiement.data(),
        resolutionDetails,
      });

      return res.status(200).json({
        status: true,
        message: "Litige résolu avec succès.",
        data: { id: updatedPaiement.id, ...updatedPaiement.data() },
      });
    } catch (error) {
      console.error("Error resolving dispute:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la résolution du litige.",
      });
    }
  }

  async initiateRefund(req, res) {
    try {
      const { id } = req.params;
      const { refundReason } = req.body;

      if (!id || !refundReason) {
        return res.status(400).json({
          status: false,
          message: "Payment ID and refund reason are required.",
        });
      }

      const paiementRef = this.collection.doc(id);
      const paiementDoc = await paiementRef.get();

      if (!paiementDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Paiement non trouvé." });
      }

      const oldPaiementData = paiementDoc.data();

      if (oldPaiementData.refundStatus !== "none") {
        return res.status(400).json({
          status: false,
          message: "Refund already initiated or completed for this payment.",
        });
      }

      await paiementRef.update({
        refundStatus: "pending",
        refundReason,
        updatedAt: new Date(),
      });

      const updatedPaiement = await paiementRef.get();

      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "INITIATE_REFUND",
        entityType: "Paiement",
        entityId: id,
        details: { oldData: oldPaiementData, newData: updatedPaiement.data() },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("payment.refund_initiated", {
        paymentId: id,
        oldData: oldPaiementData,
        newData: updatedPaiement.data(),
      });

      return res.status(200).json({
        status: true,
        message: "Remboursement initié avec succès.",
        data: { id: updatedPaiement.id, ...updatedPaiement.data() },
      });
    } catch (error) {
      console.error("Error initiating refund:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de l'initiation du remboursement.",
      });
    }
  }

  async completeRefund(req, res) {
    try {
      const { id } = req.params;
      const { refundStatus, refundDetails } = req.body;

      if (
        !id ||
        !refundStatus ||
        !["completed", "rejected"].includes(refundStatus)
      ) {
        return res.status(400).json({
          status: false,
          message:
            "Payment ID, refund status (completed/rejected) and refund details are required.",
        });
      }

      const paiementRef = this.collection.doc(id);
      const paiementDoc = await paiementRef.get();

      if (!paiementDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Paiement non trouvé." });
      }

      const oldPaiementData = paiementDoc.data();

      if (oldPaiementData.refundStatus !== "pending") {
        return res.status(400).json({
          status: false,
          message: "Cannot complete refund that is not pending.",
        });
      }

      await paiementRef.update({
        refundStatus,
        refundDetails,
        updatedAt: new Date(),
      });

      const updatedPaiement = await paiementRef.get();

      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "COMPLETE_REFUND",
        entityType: "Paiement",
        entityId: id,
        details: {
          oldData: oldPaiementData,
          newData: updatedPaiement.data(),
          refundDetails,
        },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("payment.refund_completed", {
        paymentId: id,
        oldData: oldPaiementData,
        newData: updatedPaiement.data(),
        refundDetails,
      });

      return res.status(200).json({
        status: true,
        message: "Remboursement complété avec succès.",
        data: { id: updatedPaiement.id, ...updatedPaiement.data() },
      });
    } catch (error) {
      console.error("Error completing refund:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la complétion du remboursement.",
      });
    }
  }
}

module.exports = new PaiementController();
