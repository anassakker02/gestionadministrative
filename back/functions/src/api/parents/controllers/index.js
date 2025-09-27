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

      console.log("🔍 Données reçues pour création parent:", {
        nom: nom?.substring(0, 20) + "...",
        prenom: prenom?.substring(0, 20) + "...",
        email: email?.substring(0, 30) + "...",
        telephone: telephone?.substring(0, 15) + "...",
        adresse: adresse?.substring(0, 30) + "...",
        passwordLength: password?.length
      });

      if (!nom || !prenom || !email || !password) {
        return res.status(400).json({ status: false, message: "Nom, prénom, email et mot de passe sont requis" });
      }

      // Validation des longueurs minimales
      if (nom.trim().length < 2) {
        return res.status(400).json({ status: false, message: "Le nom doit contenir au moins 2 caractères" });
      }
      if (prenom.trim().length < 2) {
        return res.status(400).json({ status: false, message: "Le prénom doit contenir au moins 2 caractères" });
      }
      if (password.length < 6) {
        return res.status(400).json({ status: false, message: "Le mot de passe doit contenir au moins 6 caractères" });
      }

      // Validation de l'email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ status: false, message: "Format d'email invalide" });
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
      console.log("🔐 Hachage du mot de passe...");
      const hashedPassword = await bcrypt.hash(password, 10);

      // Créer l'utilisateur d'abord
      console.log("👤 Création de l'utilisateur...");
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
      if (telephone && telephone.trim() && telephone.trim().length >= 3) {
        console.log("📞 Encryption du téléphone...");
        try {
          userData.telephone = encrypt(telephone.trim());
          console.log("✅ Téléphone encrypté avec succès");
        } catch (encryptError) {
          console.error("❌ Erreur encryption téléphone:", encryptError);
          throw new Error(`Erreur encryption téléphone: ${encryptError.message}`);
        }
      }
      if (adresse && adresse.trim() && adresse.trim().length >= 3) {
        console.log("🏠 Encryption de l'adresse...");
        try {
          userData.adresse = encrypt(adresse.trim());
          console.log("✅ Adresse encryptée avec succès");
        } catch (encryptError) {
          console.error("❌ Erreur encryption adresse:", encryptError);
          throw new Error(`Erreur encryption adresse: ${encryptError.message}`);
        }
      }

      console.log("💾 Sauvegarde de l'utilisateur dans Firestore...");
      console.log("📋 Données utilisateur à sauvegarder:", {
        email: userData.email,
        nom: userData.nom,
        prenom: userData.prenom,
        role: userData.role,
        hasTelephone: !!userData.telephone,
        hasAdresse: !!userData.adresse
      });
      
      const userDocRef = await db.collection("users").add(userData);
      console.log("✅ Utilisateur créé avec ID:", userDocRef.id);

      // Créer le parent avec référence à l'utilisateur
      console.log("👨‍👩‍👧‍👦 Création du parent...");
      const parentData = {
        nom: nom.trim(),
        prenom: prenom.trim(),
        userId: userDocRef.id, // Référence vers l'utilisateur
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Encryption de l'email avec gestion d'erreur
      console.log("📧 Encryption de l'email parent...");
      try {
        parentData.email = encrypt(email.trim());
        console.log("✅ Email parent encrypté avec succès");
      } catch (encryptError) {
        console.error("❌ Erreur encryption email parent:", encryptError);
        throw new Error(`Erreur encryption email parent: ${encryptError.message}`);
      }

      // Ajouter les champs optionnels s'ils sont fournis
      if (telephone && telephone.trim() && telephone.trim().length >= 3) {
        console.log("📞 Encryption du téléphone parent...");
        try {
          parentData.telephone = encrypt(telephone.trim());
          console.log("✅ Téléphone parent encrypté avec succès");
        } catch (encryptError) {
          console.error("❌ Erreur encryption téléphone parent:", encryptError);
          throw new Error(`Erreur encryption téléphone parent: ${encryptError.message}`);
        }
      }
      if (adresse && adresse.trim() && adresse.trim().length >= 3) {
        console.log("🏠 Encryption de l'adresse parent...");
        try {
          parentData.adresse = encrypt(adresse.trim());
          console.log("✅ Adresse parent encryptée avec succès");
        } catch (encryptError) {
          console.error("❌ Erreur encryption adresse parent:", encryptError);
          throw new Error(`Erreur encryption adresse parent: ${encryptError.message}`);
        }
      }

      console.log("💾 Sauvegarde du parent dans Firestore...");
      console.log("📋 Données parent à sauvegarder:", {
        nom: parentData.nom,
        prenom: parentData.prenom,
        email: parentData.email ? "encrypted" : "not provided",
        userId: parentData.userId,
        hasTelephone: !!parentData.telephone,
        hasAdresse: !!parentData.adresse
      });
      
      const parentDocRef = await this.collection.add(parentData);
      console.log("✅ Parent créé avec ID:", parentDocRef.id);
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
      console.error("❌ Error creating parent:", error);
      console.error("❌ Error details:", error.message);
      console.error("❌ Error stack:", error.stack);
      
      // Gestion spécifique des erreurs
      let errorMessage = "Erreur lors de la création du parent";
      
      if (error.message.includes("Invalid key length")) {
        errorMessage = "Erreur de validation des données. Vérifiez le format des champs.";
        console.error("🔑 Problème de clé d'encryption détecté");
      } else if (error.message.includes("permission")) {
        errorMessage = "Erreur de permissions. Vérifiez les droits d'accès.";
      } else if (error.message.includes("network")) {
        errorMessage = "Erreur de connexion à la base de données.";
      }
      
      return res.status(500).json({ 
        status: false, 
        message: errorMessage,
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

  /**
   * Lier un parent à un étudiant
   * POST /parents/:id/link-student
   */
  async linkStudent(req, res) {
    try {
      const { id } = req.params;
      const { studentId } = req.body;

      if (!studentId) {
        return res.status(400).json({
          status: false,
          message: "ID de l'étudiant requis"
        });
      }

      // Vérifier que le parent existe
      const parentDoc = await this.collection.doc(id).get();
      if (!parentDoc.exists) {
        return res.status(404).json({
          status: false,
          message: "Parent non trouvé"
        });
      }

      // Vérifier que l'étudiant existe
      const studentDoc = await db.collection("etudiants").doc(studentId).get();
      if (!studentDoc.exists) {
        return res.status(404).json({
          status: false,
          message: "Étudiant non trouvé"
        });
      }

      const parentData = parentDoc.data();
      const studentData = studentDoc.data();

      // Vérifier si déjà lié
      if (parentData.etudiant_id === studentId) {
        return res.status(200).json({
          status: true,
          message: "Parent et étudiant déjà liés",
          data: {
            parent: {
              id: parentDoc.id,
              nom: parentData.nom,
              prenom: parentData.prenom
            },
            student: {
              id: studentDoc.id,
              nom: studentData.nom,
              prenom: studentData.prenom
            }
          }
        });
      }

      // Mettre à jour le parent avec l'ID de l'étudiant
      await this.collection.doc(id).update({
        etudiant_id: studentId,
        updatedAt: new Date()
      });

      // Mettre à jour l'étudiant avec l'ID du parent
      await db.collection("etudiants").doc(studentId).update({
        parentId: encrypt(id),
        updatedAt: new Date()
      });

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'LINK_PARENT_STUDENT',
        entityType: 'Parent',
        entityId: id,
        details: { 
          parentId: id,
          studentId,
          parentName: `${parentData.prenom} ${parentData.nom}`,
          studentName: `${studentData.prenom} ${studentData.nom}`
        },
      });
      await auditLog.save();

      return res.status(200).json({
        status: true,
        message: "Parent lié à l'étudiant avec succès",
        data: {
          parent: {
            id: parentDoc.id,
            nom: parentData.nom,
            prenom: parentData.prenom,
            etudiant_id: studentId
          },
          student: {
            id: studentDoc.id,
            nom: studentData.nom,
            prenom: studentData.prenom,
            parentId: id
          }
        }
      });

    } catch (error) {
      console.error("Error linking parent to student:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la liaison parent-étudiant"
      });
    }
  }

  /**
   * Obtenir les informations de l'étudiant d'un parent
   * GET /parents/:id/student
   */
  async getParentStudent(req, res) {
    try {
      const { id } = req.params;

      // Récupérer le parent
      const parentDoc = await this.collection.doc(id).get();
      if (!parentDoc.exists) {
        return res.status(404).json({
          status: false,
          message: "Parent non trouvé"
        });
      }

      const parentData = parentDoc.data();

      if (!parentData.etudiant_id) {
        return res.status(404).json({
          status: false,
          message: "Aucun étudiant assigné à ce parent"
        });
      }

      // Récupérer l'étudiant
      const studentDoc = await db.collection("etudiants").doc(parentData.etudiant_id).get();
      if (!studentDoc.exists) {
        return res.status(404).json({
          status: false,
          message: "Étudiant assigné non trouvé"
        });
      }

      const studentData = studentDoc.data();

      // Décrypter les données sensibles de l'étudiant
      const decryptedStudent = {
        id: studentDoc.id,
        nom: studentData.nom,
        prenom: studentData.prenom,
        email: studentData.email,
        telephone: studentData.telephone ? decrypt(studentData.telephone) : null,
        adresse: studentData.adresse ? decrypt(studentData.adresse) : null,
        date_naissance: studentData.date_naissance,
        classe_id: studentData.classe_id,
        nationalite: studentData.nationalite,
        bourse_id: studentData.bourse_id,
        parentId: studentData.parentId ? decrypt(studentData.parentId) : null,
        createdAt: studentData.createdAt,
        updatedAt: studentData.updatedAt
      };

      return res.status(200).json({
        status: true,
        data: decryptedStudent
      });

    } catch (error) {
      console.error("Error getting parent student:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la récupération de l'étudiant"
      });
    }
  }

  /**
   * Dissocier un parent d'un étudiant
   * DELETE /parents/:id/unlink-student
   */
  async unlinkStudent(req, res) {
    try {
      const { id } = req.params;

      // Récupérer le parent
      const parentDoc = await this.collection.doc(id).get();
      if (!parentDoc.exists) {
        return res.status(404).json({
          status: false,
          message: "Parent non trouvé"
        });
      }

      const parentData = parentDoc.data();

      if (!parentData.etudiant_id) {
        return res.status(400).json({
          status: false,
          message: "Aucun étudiant assigné à ce parent"
        });
      }

      const studentId = parentData.etudiant_id;

      // Mettre à jour le parent pour retirer l'ID de l'étudiant
      await this.collection.doc(id).update({
        etudiant_id: null,
        updatedAt: new Date()
      });

      // Mettre à jour l'étudiant pour retirer l'ID du parent
      await db.collection("etudiants").doc(studentId).update({
        parentId: null,
        updatedAt: new Date()
      });

      // Audit log
      const auditLog = new AuditLog({
        userId: req.user?.id || 'system',
        action: 'UNLINK_PARENT_STUDENT',
        entityType: 'Parent',
        entityId: id,
        details: { 
          parentId: id,
          studentId
        },
      });
      await auditLog.save();

      return res.status(200).json({
        status: true,
        message: "Parent dissocié de l'étudiant avec succès"
      });

    } catch (error) {
      console.error("Error unlinking parent from student:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur lors de la dissociation parent-étudiant"
      });
    }
  }
}

module.exports = new ParentController();
