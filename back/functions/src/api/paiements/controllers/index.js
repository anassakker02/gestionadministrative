
const db = require("../../../config/firebase");
// Stripe supprimé
const paypal = require("@paypal/checkout-server-sdk"); // Installez le SDK PayPal

class PaiementController {
  constructor() {
    this.collection = db.collection("paiements");
  }

  // Créer un paiement (Stripe ou PayPal)
  async create(req, res) {
    console.log("PaiementController: create method hit");
    try {
      const { montant, methode, etudiant_id, details } = req.body;

      if (!montant || !methode || !etudiant_id) {
        return res
          .status(400)
          .json({ status: false, message: "Champs requis manquants." });
      }

      let paiementResult = {};
      if (methode === "paypal") {
        // Paiement PayPal
        const env = new paypal.core.SandboxEnvironment(
          process.env.PAYPAL_CLIENT_ID,
          process.env.PAYPAL_CLIENT_SECRET
        );
        const client = new paypal.core.PayPalHttpClient(env);
        const request = new paypal.orders.OrdersCreateRequest();
        request.requestBody({
          intent: "CAPTURE",
          purchase_units: [
            { amount: { currency_code: "EUR", value: montant.toString() } },
          ],
        });
        const order = await client.execute(request);
        paiementResult = {
          paypalOrderId: order.result.id,
          status: order.result.status,
        };
      } else {
        // Paiement simple (pas Stripe, pas PayPal)
        paiementResult = { status: "enregistré" };
      }

      // Enregistrement en base
      const paiementData = {
        montant: Number(montant),
        methode,
        etudiant_id,
        details: details || {},
        status: paiementResult.status,
        external_id: paiementResult.paypalOrderId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const docRef = await this.collection.add(paiementData);
      const newPaiement = await docRef.get();

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
      const { montant, status, details } = req.body;
      const paiementRef = this.collection.doc(id);
      const paiementDoc = await paiementRef.get();
      if (!paiementDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Paiement non trouvé" });
      }
      const updateData = { updatedAt: new Date() };
      if (montant !== undefined) updateData.montant = Number(montant);
      if (status !== undefined) updateData.status = status;
      if (details !== undefined) updateData.details = details;
      await paiementRef.update(updateData);
      const updatedPaiement = await paiementRef.get();
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
      await paiementRef.delete();
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
}

module.exports = new PaiementController();
