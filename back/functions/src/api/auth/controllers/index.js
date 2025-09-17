// const User = require('../../../classes/user'); // eslint-disable-line no-unused-vars
const db = require("../../../config/firebase");
const jwt = require('jsonwebtoken'); // eslint-disable-line no-unused-vars
const bcrypt = require("bcrypt");
const AuditLog = require('../../../classes/AuditLog');
// const sendEmail = require('../../../utils/sendmail'); // eslint-disable-line no-unused-vars

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
      const ipAddress = req.headers['x-forwarded-for'] || req.ip || 'unknown';
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
        // Audit log for failed login attempt (email not found)
        const auditLog = new AuditLog({
          userId: null,
          action: 'USER_LOGIN_FAILURE',
          entityType: 'User',
          entityId: null,
          details: { email, reason: 'Email not found', ipAddress },
        });
        await auditLog.save();
        return res
          .status(401)
          .json({ message: "Email ou mot de passe incorrect", status: false });
      }
      const userDoc = userSnapshot.docs[0];
      const user = userDoc.data();
      // Vérifier le mot de passe
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        // Audit log for failed login attempt (incorrect password)
        const auditLog = new AuditLog({
          userId: userDoc.id,
          action: 'USER_LOGIN_FAILURE',
          entityType: 'User',
          entityId: userDoc.id,
          details: { email, reason: 'Incorrect password', ipAddress },
        });
        await auditLog.save();
        return res
          .status(401)
          .json({ message: "Email ou mot de passe incorrect", status: false });
      }
      // Générer un token (optionnel, ici simple exemple)
      // const token = jwt.sign({ id: userDoc.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });
      // Pour l'exemple, on retourne juste un indicateur de succès
      const accessToken = jwt.sign(
        { id: userDoc.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }
      );

      const refreshToken = jwt.sign(
        { id: userDoc.id, email: user.email, role: user.role },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      // Audit log for successful login
      const auditLog = new AuditLog({
        userId: userDoc.id,
        action: 'USER_LOGIN_SUCCESS',
        entityType: 'User',
        entityId: userDoc.id,
        details: { email: user.email, role: user.role, ipAddress },
      });
      await auditLog.save();

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
        token: accessToken,
        refreshToken: refreshToken,
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

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token required", status: false });
      }

      let decoded;
      try {
        decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      } catch (jwtError) {
        // Audit log for invalid/expired refresh token
        const auditLog = new AuditLog({
          userId: null,
          action: 'TOKEN_REFRESH_FAILURE',
          entityType: 'User',
          entityId: null,
          details: { refreshToken, reason: 'Invalid or expired refresh token', ipAddress: req.headers['x-forwarded-for'] || req.ip || 'unknown', error: jwtError.message },
        });
        await auditLog.save();
        return res.status(403).json({ message: "Invalid or expired refresh token", status: false });
      }

      const userSnapshot = await this.collection.doc(decoded.id).get();
      if (!userSnapshot.exists) {
        // Audit log for invalid refresh token (user not found)
        const auditLog = new AuditLog({
          userId: decoded.id,
          action: 'TOKEN_REFRESH_FAILURE',
          entityType: 'User',
          entityId: decoded.id,
          details: { refreshToken, reason: 'User not found for refresh token', ipAddress: req.headers['x-forwarded-for'] || req.ip || 'unknown' },
        });
        await auditLog.save();
        return res.status(401).json({ message: "Invalid refresh token", status: false });
      }

      const user = userSnapshot.data();

      const newAccessToken = jwt.sign(
        { id: userSnapshot.id, email: user?.email, role: user?.role },
        process.env.JWT_SECRET,
        { expiresIn: "30m" }
      );

      const newRefreshToken = jwt.sign(
        { id: userSnapshot.id, email: user?.email, role: user?.role },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" }
      );

      // Audit log for successful token refresh
      const auditLog = new AuditLog({
        userId: userSnapshot.id,
        action: 'TOKEN_REFRESH_SUCCESS',
        entityType: 'User',
        entityId: userSnapshot.id,
        details: { email: user.email, role: user.role, ipAddress: req.headers['x-forwarded-for'] || req.ip || 'unknown' },
      });
      await auditLog.save();

      return res.status(200).json({
        status: true,
        message: "Token refreshed successfully",
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });

    } catch (error) {
      console.error("Error refreshing token:", error);
      return res.status(403).json({ message: "Invalid or expired refresh token", status: false });
    }
  }

  async me(req, res) {
    try {
      // Assuming authMiddleware has already set req.user with user ID
      const userId = req.user.id;
      const userDoc = await this.collection.doc(userId).get();

      if (!userDoc.exists) {
        return res.status(404).json({ message: "User not found", status: false });
      }

      const user = userDoc.data();

      return res.status(200).json({
        status: true,
        message: "User data retrieved successfully",
        user: {
          id: userDoc.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role || "",
        },
      });
    } catch (error) {
      console.error("Error in me method:", error);
      return res.status(500).json({ message: "Server error", status: false });
    }
  }
}

module.exports = new UserController();
