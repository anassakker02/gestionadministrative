const Parent = require('../../../classes/Parent');
const db = require("../../../config/firebase");
const AuditLog = require('../../../classes/AuditLog');
const { encrypt, decrypt } = require('../../../utils/encryption');
const bcrypt = require('bcryptjs');

class ParentController {
  constructor() {
    this.collection = db.collection("parents");
  }

  async create(req, res) {
    try {
      const { nom, prenom, email, telephone, adresse, password } = req.body;

      if (!nom || !prenom || !email || !password) {
        return res.status(400).json({ status: false, message: "Nom, prénom, email et mot de passe sont requis" });
      }

      // Vérifier si l'email existe déjà dans la table users
      const existingUser = await db
        .collection("users")
        .where("email", "==", email.trim())
        .get();
      
      if (!existingUser.empty) {
        return res.status(400).json({ status: false, message: "L'email existe déjà" });
      }

      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur d'abord
      const userData = {
        email: email.trim(),
        password: hashedPassword,
        nom: nom.trim(),
        prenom: prenom.trim(),
        role: "parent",
        status: "active",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Ajouter les champs optionnels s'ils sont fournis
      if (telephone && telephone.trim()) {
        userData.telephone = encrypt(telephone.trim());
      }
      if (adresse && adresse.trim()) {
        userData.adresse = encrypt(adresse.trim());
      }

      const userDocRef = await db.collection("users").add(userData);

      // Créer le parent avec référence à l'utilisateur
      const parentData = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: encrypt(email.trim()),
        userId: userDocRef.id, // Référence vers l'utilisateur
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Ajouter les champs optionnels s'ils sont fournis
      if (telephone && telephone.trim()) {
        parentData.telephone = encrypt(telephone.trim());
      }
      if (adresse && adresse.trim()) {
        parentData.adresse = encrypt(adresse.trim());
      }

      const parentDocRef = await this.collection.add(parentData);
      const newParent = await parentDocRef.get();

      // Audit log pour le parent
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'CREATE_PARENT',
        entityType: 'Parent',
        entityId: newParent.id,
        details: { 
          newParentData: newParent.data(),
          userId: userDocRef.id 
        },
      });
      await auditLog.save();

      // Audit log pour l'utilisateur
      const userAuditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'CREATE_USER',
        entityType: 'User',
        entityId: userDocRef.id,
        details: { 
          role: 'parent',
          parentId: newParent.id 
        },
      });
      await userAuditLog.save();

      return res.status(201).json({ 
        status: true, 
        message: "Parent et utilisateur créés avec succès", 
        data: { 
          id: newParent.id, 
          userId: userDocRef.id,
          nom: nom.trim(),
          prenom: prenom.trim(),
          email: email.trim(),
          telephone: telephone ? telephone.trim() : null,
          adresse: adresse ? adresse.trim() : null,
        } 
      });
    } catch (error) {
      console.error("Error creating parent:", error);
      console.error("Error details:", error.message);
      console.error("Error stack:", error.stack);
      return res.status(500).json({ 
        status: false, 
        message: "Erreur lors de la création du parent",
        error: error.message 
      });
    }
  }

  async getAll(req, res) {
    try {
      const snapshot = await this.collection.get();
      const parents = snapshot.docs.map((doc) => {
        const parentData = doc.data();
        if (parentData.email) parentData.email = decrypt(parentData.email);
        if (parentData.telephone) parentData.telephone = decrypt(parentData.telephone);
        if (parentData.adresse) parentData.adresse = decrypt(parentData.adresse);
        return { id: doc.id, ...parentData };
      });

      return res.status(200).json({ status: true, data: parents });
    } catch (error) {
      console.error("Error getting all parents:", error);
      return res.status(500).json({ status: false, message: "Erreur lors de la récupération des parents" });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ status: false, message: "ID du parent requis" });
      }
      const parentDoc = await this.collection.doc(id).get();
      if (!parentDoc.exists) {
        return res.status(404).json({ status: false, message: "Parent non trouvé" });
      }

      const parentData = parentDoc.data();
      if (parentData.email) parentData.email = decrypt(parentData.email);
      if (parentData.telephone) parentData.telephone = decrypt(parentData.telephone);
      if (parentData.adresse) parentData.adresse = decrypt(parentData.adresse);

      return res.status(200).json({ status: true, data: { id: parentDoc.id, ...parentData } });
    } catch (error) {
      console.error("Error getting parent by ID:", error);
      return res.status(500).json({ status: false, message: "Erreur lors de la récupération du parent" });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { nom, prenom, email, telephone, adresse } = req.body;

      if (!id) {
        return res.status(400).json({ status: false, message: "ID du parent requis" });
      }

      const parentRef = this.collection.doc(id);
      const parentDoc = await parentRef.get();
      if (!parentDoc.exists) {
        return res.status(404).json({ status: false, message: "Parent non trouvé" });
      }

      const oldParentData = parentDoc.data(); // For audit log

      const updateData = { updatedAt: new Date() };
      if (nom !== undefined) updateData.nom = nom.trim();
      if (prenom !== undefined) updateData.prenom = prenom.trim();
      if (email !== undefined) updateData.email = encrypt(email.trim());
      if (telephone !== undefined) updateData.telephone = encrypt(telephone.trim());
      if (adresse !== undefined) updateData.adresse = encrypt(adresse.trim());

      await parentRef.update(updateData);
      const updatedParent = await parentRef.get();

      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'UPDATE_PARENT',
        entityType: 'Parent',
        entityId: id,
        details: { oldData: oldParentData, newData: updatedParent.data() },
      });
      await auditLog.save();

      return res.status(200).json({ status: true, message: "Parent mis à jour avec succès", data: { id: updatedParent.id, ...updatedParent.data() } });
    } catch (error) {
      console.error("Error updating parent:", error);
      return res.status(500).json({ status: false, message: "Erreur lors de la mise à jour du parent" });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      if (!id) {
        return res.status(400).json({ status: false, message: "ID du parent requis" });
      }

      const parentRef = this.collection.doc(id);
      const parentDoc = await parentRef.get();
      if (!parentDoc.exists) {
        return res.status(404).json({ status: false, message: "Parent non trouvé" });
      }

      const deletedParentData = parentDoc.data(); // For audit log

      // Check if any students are linked to this parent
      const studentsSnapshot = await db.collection("etudiants").where("parentId", "==", id).get();
      if (!studentsSnapshot.empty) {
        return res.status(400).json({ status: false, message: "Impossible de supprimer ce parent car des étudiants y sont liés" });
      }

      await parentRef.delete();

      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'DELETE_PARENT',
        entityType: 'Parent',
        entityId: id,
        details: { deletedParentData },
      });
      await auditLog.save();

      return res.status(200).json({ status: true, message: "Parent supprimé avec succès" });
    } catch (error) {
      console.error("Error deleting parent:", error);
      return res.status(500).json({ status: false, message: "Erreur lors de la suppression du parent" });
    }
  }
}

module.exports = new ParentController();
