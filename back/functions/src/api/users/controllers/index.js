const db = require("../../../config/firebase");
const sendEmail = require("../../../utils/sendmail"); // import corrigé
const AuditLog = require("../../../classes/AuditLog");
const { sendWebhook } = require("../../../utils/webhookSender");
const { encrypt, decrypt } = require("../../../utils/encryption");

class UsersController {
  constructor() {
    this.collection = db.collection("users");
  }

  // Récupérer tous les utilisateurs
  async getAll(req, res) {
    try {
      const { status, role } = req.query;
      let query = this.collection;

      if (status) {
        query = query.where("status", "==", status);
      }
      if (role) {
        query = query.where("role", "==", role);
      }

      const snapshot = await query.get();
      const users = snapshot.docs.map((doc) => {
        const userData = doc.data();
        if (userData.telephone)
          userData.telephone = decrypt(userData.telephone);
        if (userData.adresse) userData.adresse = decrypt(userData.adresse);
        // Ne pas retourner le mot de passe
        delete userData.password;
        return { id: doc.id, ...userData };
      });
      return res.status(200).json({ status: true, data: users });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la récupération des utilisateurs",
        error: error.message,
      });
    }
  }

  // Récupérer les utilisateurs en attente d'affectation de rôle
  async getPendingUsers(req, res) {
    try {
      // Vérifier que l'utilisateur connecté peut affecter des rôles
      if (
        !req.user ||
        (req.user.role !== "admin" && req.user.role !== "sub-admin")
      ) {
        return res.status(403).json({
          message: "Non autorisé à voir les utilisateurs en attente",
          status: false,
        });
      }

      // Chercher les utilisateurs sans rôle (role: null) ou avec status: "pending"
      const snapshotNoRole = await this.collection
        .where("role", "==", null)
        .orderBy("createdAt", "desc")
        .get();

      const snapshotPending = await this.collection
        .where("status", "==", "pending")
        .orderBy("createdAt", "desc")
        .get();

      // Combiner les résultats et éviter les doublons
      const allPendingDocs = [...snapshotNoRole.docs];
      snapshotPending.docs.forEach((doc) => {
        if (!allPendingDocs.find((existing) => existing.id === doc.id)) {
          allPendingDocs.push(doc);
        }
      });

      const pendingUsers = allPendingDocs.map((doc) => {
        const userData = doc.data();
        if (userData.telephone)
          userData.telephone = decrypt(userData.telephone);
        if (userData.adresse) userData.adresse = decrypt(userData.adresse);
        // Ne pas retourner le mot de passe
        delete userData.password;
        return { id: doc.id, ...userData };
      });

      return res.status(200).json({
        status: true,
        data: pendingUsers,
        message: `${pendingUsers.length} utilisateur(s) en attente d'affectation de rôle`,
      });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la récupération des utilisateurs en attente",
        error: error.message,
      });
    }
  }

  // Récupérer les users disponibles pour création de fiche étudiant
  async getAvailableUsersForStudent(req, res) {
    try {
      // Seuls admin et sub-admin peuvent utiliser cette route
      if (
        !req.user ||
        (req.user.role !== "admin" && req.user.role !== "sub-admin")
      ) {
        return res.status(403).json({ status: false, message: "Non autorisé" });
      }

      // Chercher tous les users avec role 'user' (comptes standards)
      const usersSnapshot = await this.collection
        .where("role", "==", "user")
        .get();
      const users = [];

      for (const doc of usersSnapshot.docs) {
        const u = { id: doc.id, ...doc.data() };
        // Vérifier si une fiche etudiant existe pour ce user
        const etuSnapshot = await db
          .collection("etudiants")
          .where("user_id", "==", doc.id)
          .limit(1)
          .get();
        // Toujours renvoyer le user, mais indiquer s'il a déjà une fiche etudiant
        u.hasEtudiant = !etuSnapshot.empty;
        // Ne pas retourner le mot de passe
        delete u.password;
        if (u.telephone) u.telephone = decrypt(u.telephone);
        if (u.adresse) u.adresse = decrypt(u.adresse);
        users.push(u);
      }

      return res.status(200).json({
        status: true,
        data: users,
        message: `${users.length} utilisateur(s) disponibles pour création d'étudiant`,
      });
    } catch (error) {
      console.error("Erreur getAvailableUsersForStudent:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur serveur",
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

      const userData = userDoc.data();
      if (userData.telephone) userData.telephone = decrypt(userData.telephone);
      if (userData.adresse) userData.adresse = decrypt(userData.adresse);

      return res
        .status(200)
        .json({ status: true, data: { id: userDoc.id, ...userData } });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la récupération de l'utilisateur",
        error: error.message,
      });
    }
  }

  // Créer un nouvel utilisateur
  async create(req, res) {
    try {
      const { email, nom, prenom, password, role, telephone, adresse } =
        req.body;
      if (!email || !nom || !password || !role)
        return res.status(400).json({
          status: false,
          message: "Email, nom, mot de passe et rôle requis",
        });

      const newUser = new (require("../../../classes/User"))({
        email,
        nom,
        prenom,
        password,
        role,
        telephone,
        adresse,
      });
      await newUser.hashPassword(); // Hash the password

      const userData = {
        email: newUser.email,
        nom: newUser.nom,
        prenom: newUser.prenom,
        password: newUser.password,
        role: newUser.role,
        telephone: newUser.telephone,
        adresse: newUser.adresse,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt,
      };

      // Encrypt sensitive fields before saving
      if (userData.telephone) userData.telephone = encrypt(userData.telephone);
      if (userData.adresse) userData.adresse = encrypt(userData.adresse);

      const docRef = await this.collection.add(userData);
      const createdUser = await docRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "CREATE_USER",
        entityType: "User",
        entityId: createdUser.id,
        details: { newUserData: createdUser.data() },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("user.created", {
        userId: createdUser.id,
        ...createdUser.data(),
      });

      return res.status(201).json({
        status: true,
        message: "Utilisateur créé",
        data: { id: createdUser.id, ...createdUser.data() },
      });
    } catch (error) {
      return res.status(500).json({
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
      const {
        email,
        nom,
        prenom,
        role,
        telephone,
        adresse,
        isActive,
        emailNotifications,
        smsNotifications,
      } = req.body;
      if (!id)
        return res.status(400).json({ status: false, message: "ID requis" });
      const userRef = this.collection.doc(id);
      const userDoc = await userRef.get();
      if (!userDoc.exists)
        return res
          .status(404)
          .json({ status: false, message: "Utilisateur non trouvé" });

      const oldUserData = userDoc.data(); // Get old data for audit log

      const updateData = { updatedAt: new Date() };
      if (email !== undefined) updateData.email = email.trim();
      if (nom !== undefined) updateData.nom = nom.trim();
      if (prenom !== undefined) updateData.prenom = prenom.trim();
      if (role !== undefined) updateData.role = role.trim();
      if (telephone !== undefined)
        updateData.telephone = encrypt(telephone.trim());
      if (adresse !== undefined) updateData.adresse = encrypt(adresse.trim());
      if (isActive !== undefined) updateData.isActive = isActive;
      if (emailNotifications !== undefined)
        updateData.emailNotifications = emailNotifications;
      if (smsNotifications !== undefined)
        updateData.smsNotifications = smsNotifications;

      await userRef.update(updateData);
      const updatedUser = await userRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "UPDATE_USER",
        entityType: "User",
        entityId: id,
        details: { oldData: oldUserData, newData: updatedUser.data() },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("user.updated", {
        userId: id,
        oldData: oldUserData,
        newData: updatedUser.data(),
      });

      return res.status(200).json({
        status: true,
        message: "Utilisateur mis à jour",
        data: { id: updatedUser.id, ...updatedUser.data() },
      });
    } catch (error) {
      return res.status(500).json({
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

      const deletedUserData = userDoc.data(); // Get data before deletion for audit log

      await userRef.delete();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "DELETE_USER",
        entityType: "User",
        entityId: id,
        details: { deletedUserData },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("user.deleted", { userId: id, deletedUserData });

      return res
        .status(200)
        .json({ status: true, message: "Utilisateur supprimé" });
    } catch (error) {
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la suppression de l'utilisateur",
        error: error.message,
      });
    }
  }

  // Activer un utilisateur
  async activateUser(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ status: false, message: "ID requis" });
      }
      const userRef = this.collection.doc(id);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Utilisateur non trouvé" });
      }

      const oldUserData = userDoc.data(); // Get old data for audit log

      await userRef.update({ isActive: true, updatedAt: new Date() });
      const updatedUser = await userRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "ACTIVATE_USER",
        entityType: "User",
        entityId: id,
        details: { oldData: oldUserData, newData: updatedUser.data() },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("user.activated", {
        userId: id,
        oldData: oldUserData,
        newData: updatedUser.data(),
      });

      return res.status(200).json({
        status: true,
        message: "Utilisateur activé",
        data: { id: updatedUser.id, ...updatedUser.data() },
      });
    } catch (error) {
      console.error("Error in activateUser:", error);
      return res.status(500).json({
        message: "Erreur lors de l'activation de l'utilisateur",
        status: false,
      });
    }
  }

  // Désactiver un utilisateur
  async deactivateUser(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ status: false, message: "ID requis" });
      }
      const userRef = this.collection.doc(id);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Utilisateur non trouvé" });
      }

      const oldUserData = userDoc.data(); // Get old data for audit log

      await userRef.update({ isActive: false, updatedAt: new Date() });
      const updatedUser = await userRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "DEACTIVATE_USER",
        entityType: "User",
        entityId: id,
        details: { oldData: oldUserData, newData: updatedUser.data() },
      });
      await auditLog.save();

      // Send webhook notification
      await sendWebhook("user.deactivated", {
        userId: id,
        oldData: oldUserData,
        newData: updatedUser.data(),
      });

      return res.status(200).json({
        status: true,
        message: "Utilisateur désactivé",
        data: { id: updatedUser.id, ...updatedUser.data() },
      });
    } catch (error) {
      console.error("Error in deactivateUser:", error);
      return res.status(500).json({
        message: "Erreur lors de la désactivation de l'utilisateur",
        status: false,
      });
    }
  }

  // Mettre à jour les préférences de notification d'un utilisateur
  async updateNotificationPreferences(req, res) {
    try {
      const { id } = req.params;
      const { emailNotifications, smsNotifications } = req.body;

      if (!id) {
        return res.status(400).json({ status: false, message: "ID requis" });
      }

      if (emailNotifications === undefined && smsNotifications === undefined) {
        return res.status(400).json({
          status: false,
          message: "Au moins une préférence de notification est requise",
        });
      }

      const userRef = this.collection.doc(id);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res
          .status(404)
          .json({ status: false, message: "Utilisateur non trouvé" });
      }

      const oldUserData = userDoc.data(); // Get old data for audit log

      const updateData = { updatedAt: new Date() };
      if (emailNotifications !== undefined) {
        updateData.emailNotifications = emailNotifications;
      }
      if (smsNotifications !== undefined) {
        updateData.smsNotifications = smsNotifications;
      }

      await userRef.update(updateData);
      const updatedUser = await userRef.get();

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || "system",
        action: "UPDATE_NOTIFICATION_PREFERENCES",
        entityType: "User",
        entityId: id,
        details: { oldData: oldUserData, newData: updatedUser.data() },
      });
      await auditLog.save();

      return res.status(200).json({
        status: true,
        message: "Préférences de notification mises à jour",
        data: { id: updatedUser.id, ...updatedUser.data() },
      });
    } catch (error) {
      console.error("Error in updateNotificationPreferences:", error);
      return res.status(500).json({
        message:
          "Erreur lors de la mise à jour des préférences de notification",
        status: false,
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
