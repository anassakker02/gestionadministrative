// const User = require('../../../classes/user'); // eslint-disable-line no-unused-vars
const db = require("../../../config/firebase");
// const jwt = require('jsonwebtoken'); // eslint-disable-line no-unused-vars
const bcrypt = require("bcrypt");
// const sendEmail = require('../../../utils/sendmail'); // eslint-disable-line no-unused-vars
require("dotenv").config();

class UserController {
  constructor() {
    this.collection = db.collection("users");
  }

  // Register a new user
  async register(req, res) {
    try {
      const { email, password, nom, prenom, role } = req.body;

      if (!email || !password || !nom || !prenom) {
        return res
          .status(400)
          .json({ message: "Missing required fields", status: false });
      }

      // Check if email already exists
      const existingUser = await db
        .collection("users")
        .where("email", "==", email)
        .get();
      if (!existingUser.empty) {
        return res
          .status(400)
          .json({ message: "L'email existe déjà", status: false });
      }

      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate a verification code (pour futur usage)
      // const verificationCode = crypto.randomInt(1000, 9999); // eslint-disable-line no-unused-vars

      // Create the new user object
      const newUser = {
        email,
        password: hashedPassword,
        nom,
        prenom,
        role: role && role.trim() ? role : "",
        createdAt: new Date(),
      };

      // Add user to Firestore
      await db.collection("users").add(newUser);

      return res
        .status(200)
        .json({ message: "Inscription réussie", status: true });
    } catch (error) {
      console.error("Error in register method:", error);
      return res
        .status(500)
        .json({ message: "Erreur lors de l'inscription", status: false });
    }
  }

  // Login d'un utilisateur
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res
          .status(400)
          .json({ message: "Email et mot de passe requis", status: false });
      }
      // Chercher l'utilisateur par email
      const userSnapshot = await this.collection
        .where("email", "==", email)
        .get();
      if (userSnapshot.empty) {
        return res
          .status(401)
          .json({ message: "Email ou mot de passe incorrect", status: false });
      }
      const userDoc = userSnapshot.docs[0];
      const user = userDoc.data();
      // Vérifier le mot de passe
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res
          .status(401)
          .json({ message: "Email ou mot de passe incorrect", status: false });
      }
      // Générer un token (optionnel, ici simple exemple)
      // const token = jwt.sign({ id: userDoc.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
      // Pour l'exemple, on retourne juste un indicateur de succès
      return res.status(200).json({
        status: true,
        message: "Connexion réussie",
        user: {
          id: userDoc.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role || "",
        },
      });
    } catch (error) {
      console.error("Erreur lors du login:", error);
      return res.status(500).json({ message: "Erreur serveur", status: false });
    }
  }

  // Envoi d'email de réinitialisation du mot de passe
  async sendPasswordReset(req, res) {
    // À compléter : logique d'envoi d'email
    return res.status(501).json({ message: "Non implémenté", status: false });
  }
}

module.exports = new UserController();
