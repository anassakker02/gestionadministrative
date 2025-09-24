const db = require("../../../config/firebase");
const AuditLog = require("../../../classes/AuditLog");
const { sendWebhook } = require("../../../utils/webhookSender");

class PaymentPlanController {
  constructor() {
    this.collection = db.collection("payment_plans");
  }

  /**
   * Créer un nouveau plan de paiement
   * POST /payment-plans
   */
  async create(req, res) {
    try {
      const { name, anneeScolaire, installments } = req.body;

      if (!name || !anneeScolaire || !installments || !Array.isArray(installments) || installments.length === 0) {
        return res.status(400).json({ status: false, message: "Nom, année scolaire et au moins un versement sont requis." });
      }

      // Validate installments structure
      for (const inst of installments) {
        if (typeof inst.percentage !== 'number' || typeof inst.dueDateOffsetMonths !== 'number' || typeof inst.description !== 'string') {
          return res.status(400).json({ status: false, message: "Structure des versements invalide." });
        }
      }

      const paymentPlanData = {
        name: name.trim(),
        anneeScolaire: anneeScolaire.trim(),
        installments,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await this.collection.add(paymentPlanData);
      const newPaymentPlan = await docRef.get();

      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "CREATE_PAYMENT_PLAN",
        entityType: "PaymentPlan",
        entityId: newPaymentPlan.id,
        details: { newPaymentPlanData: newPaymentPlan.data() },
      });
      await auditLog.save();

      await sendWebhook("paymentPlan.created", {
        paymentPlanId: newPaymentPlan.id,
        ...newPaymentPlan.data(),
      });

      return res.status(201).json({ status: true, data: { id: newPaymentPlan.id, ...newPaymentPlan.data() } });
    } catch (error) {
      console.error("Erreur lors de la création du plan de paiement:", error);
      return res.status(500).json({ status: false, message: "Erreur interne du serveur", error: error.message });
    }
  }

  /**
   * Récupérer tous les plans de paiement
   * GET /payment-plans
   */
  async getAll(req, res) {
    try {
      const snapshot = await this.collection.orderBy("anneeScolaire", "desc").orderBy("name").get();
      const paymentPlans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json({ status: true, data: paymentPlans });
    } catch (error) {
      console.error("Erreur lors de la récupération des plans de paiement:", error);
      return res.status(500).json({ status: false, message: "Erreur interne du serveur", error: error.message });
    }
  }

  /**
   * Récupérer un plan de paiement par ID
   * GET /payment-plans/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        return res.status(404).json({ status: false, message: "Plan de paiement non trouvé." });
      }

      return res.status(200).json({ status: true, data: { id: doc.id, ...doc.data() } });
    } catch (error) {
      console.error("Erreur lors de la récupération du plan de paiement:", error);
      return res.status(500).json({ status: false, message: "Erreur interne du serveur", error: error.message });
    }
  }

  /**
   * Mettre à jour un plan de paiement
   * PUT /payment-plans/:id
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, anneeScolaire, installments } = req.body;

      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ status: false, message: "Plan de paiement non trouvé." });
      }

      const oldPaymentPlanData = doc.data();

      const updateData = {
        updatedAt: new Date(),
      };

      if (name) updateData.name = name.trim();
      if (anneeScolaire) updateData.anneeScolaire = anneeScolaire.trim();
      if (installments) {
        if (!Array.isArray(installments) || installments.length === 0) {
          return res.status(400).json({ status: false, message: "Structure des versements invalide." });
        }
        for (const inst of installments) {
          if (typeof inst.percentage !== 'number' || typeof inst.dueDateOffsetMonths !== 'number' || typeof inst.description !== 'string') {
            return res.status(400).json({ status: false, message: "Structure des versements invalide." });
          }
        }
        updateData.installments = installments;
      }

      await docRef.update(updateData);
      const updatedPaymentPlan = await docRef.get();

      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "UPDATE_PAYMENT_PLAN",
        entityType: "PaymentPlan",
        entityId: id,
        details: { oldData: oldPaymentPlanData, newData: updatedPaymentPlan.data() },
      });
      await auditLog.save();

      await sendWebhook("paymentPlan.updated", {
        paymentPlanId: id,
        oldData: oldPaymentPlanData,
        newData: updatedPaymentPlan.data(),
      });

      return res.status(200).json({ status: true, data: { id: updatedPaymentPlan.id, ...updatedPaymentPlan.data() } });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du plan de paiement:", error);
      return res.status(500).json({ status: false, message: "Erreur interne du serveur", error: error.message });
    }
  }

  /**
   * Supprimer un plan de paiement
   * DELETE /payment-plans/:id
   */
  async delete(req, res) {
    try {
      const { id } = req.params;

      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ status: false, message: "Plan de paiement non trouvé." });
      }

      const deletedPaymentPlanData = doc.data();

      // Optional: Check if any students are using this payment plan before deleting
      const studentsUsingPlan = await db.collection("etudiants").where("paymentPlanId", "==", id).limit(1).get();
      if (!studentsUsingPlan.empty) {
        return res.status(400).json({ status: false, message: "Impossible de supprimer ce plan de paiement car il est utilisé par des étudiants." });
      }

      await docRef.delete();

      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "DELETE_PAYMENT_PLAN",
        entityType: "PaymentPlan",
        entityId: id,
        details: { deletedPaymentPlanData },
      });
      await auditLog.save();

      await sendWebhook("paymentPlan.deleted", {
        paymentPlanId: id,
        deletedPaymentPlanData,
      });

      return res.status(204).send(); // 204 No Content for successful deletion
    } catch (error) {
      console.error("Erreur lors de la suppression du plan de paiement:", error);
      return res.status(500).json({ status: false, message: "Erreur interne du serveur", error: error.message });
    }
  }
}

module.exports = new PaymentPlanController();
