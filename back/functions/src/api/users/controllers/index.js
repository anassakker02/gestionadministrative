const db = require("../../../config/firebase");
const sendEmail = require("../../../utils/sendmail"); // import corrigé

class UsersController {
  constructor() {
    this.collection = db.collection("users");
  }

  // Récupérer tous les utilisateurs
  async getAll(req, res) {
    try {
      const snapshot = await this.collection.get();
      const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json({ status: true, data: users });
    } catch (error) {
      return res
        .status(500)
        .json({
          status: false,
          message: "Erreur lors de la récupération des utilisateurs",
          error: error.message,
        });
    }
  }

  // Récupérer un utilisateur par ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      if (!id)
        return res.status(400).json({ status: false, message: "ID requis" });
      const userDoc = await this.collection.doc(id).get();
      if (!userDoc.exists)
        return res
          .status(404)
          .json({ status: false, message: "Utilisateur non trouvé" });
      return res
        .status(200)
        .json({ status: true, data: { id: userDoc.id, ...userDoc.data() } });
    } catch (error) {
      return res
        .status(500)
        .json({
          status: false,
          message: "Erreur lors de la récupération de l'utilisateur",
          error: error.message,
        });
    }
  }

  // Créer un nouvel utilisateur
  async create(req, res) {
    try {
      const { email, nom } = req.body;
      if (!email || !nom)
        return res
          .status(400)
          .json({ status: false, message: "Email et nom requis" });
      const userData = {
        email: email.trim(),
        nom: nom.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const docRef = await this.collection.add(userData);
      const newUser = await docRef.get();
      return res
        .status(201)
        .json({
          status: true,
          message: "Utilisateur créé",
          data: { id: newUser.id, ...newUser.data() },
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          status: false,
          message: "Erreur lors de la création de l'utilisateur",
          error: error.message,
        });
    }
  }

  // Mettre à jour un utilisateur
  async update(req, res) {
    try {
      const { id } = req.params;
      const { email, nom } = req.body;
      if (!id)
        return res.status(400).json({ status: false, message: "ID requis" });
      const userRef = this.collection.doc(id);
      const userDoc = await userRef.get();
      if (!userDoc.exists)
        return res
          .status(404)
          .json({ status: false, message: "Utilisateur non trouvé" });
      const updateData = { updatedAt: new Date() };
      if (email !== undefined) updateData.email = email.trim();
      if (nom !== undefined) updateData.nom = nom.trim();
      await userRef.update(updateData);
      const updatedUser = await userRef.get();
      return res
        .status(200)
        .json({
          status: true,
          message: "Utilisateur mis à jour",
          data: { id: updatedUser.id, ...updatedUser.data() },
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          status: false,
          message: "Erreur lors de la mise à jour de l'utilisateur",
          error: error.message,
        });
    }
  }

  // Supprimer un utilisateur
  async delete(req, res) {
    try {
      const { id } = req.params;
      if (!id)
        return res.status(400).json({ status: false, message: "ID requis" });
      const userRef = this.collection.doc(id);
      const userDoc = await userRef.get();
      if (!userDoc.exists)
        return res
          .status(404)
          .json({ status: false, message: "Utilisateur non trouvé" });
      await userRef.delete();
      return res
        .status(200)
        .json({ status: true, message: "Utilisateur supprimé" });
    } catch (error) {
      return res
        .status(500)
        .json({
          status: false,
          message: "Erreur lors de la suppression de l'utilisateur",
          error: error.message,
        });
    }
  }

  // Envoi d'email de réinitialisation du mot de passe
  async sendPasswordReset(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res
          .status(400)
          .json({ message: "Adresse email requise", status: false });
      }
      const users = await db
        .collection("users")
        .where("email", "==", email)
        .get();
      if (users.empty) {
        return res
          .status(404)
          .json({ message: "Aucun utilisateur trouvé", status: false });
      }
      const resetToken = "dummy-token"; // placeholder si JWT non utilisé pour l'instant
      const resetLink = `http://127.0.0.1:5001/reset-password?token=${resetToken}`;
      await sendEmail({
        to: email,
        subject: "Réinitialisation de votre mot de passe",
        template: "verificationForPassword",
        context: { resetLink, email, expiresIn: "15 minutes" },
      });
      return res
        .status(200)
        .json({ status: true, message: "Email de réinitialisation envoyé" });
    } catch (error) {
      console.error("Error in sendPasswordReset:", error);
      return res
        .status(500)
        .json({ message: "Erreur lors de l'envoi de l'email", status: false });
    }
  }
}

module.exports = new UsersController();

