const Parent = require('../../../classes/Parent');
const db = require("../../../config/firebase");
const AuditLog = require('../../../classes/AuditLog');
const { encrypt, decrypt } = require('../../../utils/encryption');

class ParentController {
  constructor() {
    this.collection = db.collection("parents");
  }

  async create(req, res) {
    try {
      const { nom, prenom, email, telephone, adresse } = req.body;

      if (!nom || !prenom || !email) {
        return res.status(400).json({ status: false, message: "Nom, prénom et email sont requis" });
      }

      const parentData = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim(),
        telephone: telephone || null,
        adresse: adresse.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Encrypt sensitive fields before saving
      if (parentData.email) parentData.email = encrypt(parentData.email);
      if (parentData.telephone) parentData.telephone = encrypt(parentData.telephone);
      if (parentData.adresse) parentData.adresse = encrypt(parentData.adresse);

      const docRef = await this.collection.add(parentData);
      const newParent = await docRef.get();

      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'CREATE_PARENT',
        entityType: 'Parent',
        entityId: newParent.id,
        details: { newParentData: newParent.data() },
      });
      await auditLog.save();

      return res.status(201).json({ status: true, message: "Parent créé avec succès", data: { id: newParent.id, ...newParent.data() } });
    } catch (error) {
      console.error("Error creating parent:", error);
      return res.status(500).json({ status: false, message: "Erreur lors de la création du parent" });
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
