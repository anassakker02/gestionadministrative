const bcrypt = require("bcrypt");

class User {
  constructor(data) {
    this.id = data.id;
    this.nom = data.nom;
    this.prenom = data.prenom || null;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role; // admin, sous-admin, comptable, étudiant, parent, enseignant, personnel, null (en attente)
    this.telephone = data.telephone || null;
    this.adresse = data.adresse || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.isActive = data.isActive === undefined ? true : data.isActive;
    this.emailNotifications =
      data.emailNotifications === undefined ? true : data.emailNotifications;
    this.smsNotifications =
      data.smsNotifications === undefined ? true : data.smsNotifications;
    this.createdBy = data.createdBy || null; // ID de l'admin/sous-admin qui a créé ou affecté le rôle
    this.assignedAt = data.assignedAt || null; // Date d'affectation du rôle
    this.status = data.status || "pending"; // pending, active, inactive
  }

  async hashPassword() {
    try {
      this.password = await bcrypt.hash(this.password, 10);
    } catch (error) {
      throw new Error("Erreur lors du hachage du mot de passe");
    }
  }

  async verifyPassword(inputPassword) {
    try {
      return await bcrypt.compare(inputPassword, this.password);
    } catch (error) {
      throw new Error("Erreur lors de la vérification du mot de passe");
    }
  }

  // Vérifier si l'utilisateur peut créer des sous-admins (seulement admin principal)
  canCreateSubAdmin() {
    return this.role === "admin";
  }

  // Vérifier si l'utilisateur peut affecter des rôles (admin ou sous-admin)
  canAssignRoles() {
    return this.role === "admin" || this.role === "sous-admin";
  }

  // Vérifier si l'utilisateur peut gérer un autre utilisateur
  canManageUser(targetUser) {
    if (this.role === "admin") return true;
    if (this.role === "sous-admin") {
      // Sous-admin ne peut pas gérer admin ou autres sous-admins
      return targetUser.role !== "admin" && targetUser.role !== "sous-admin";
    }
    return false;
  }

  // Assigner un rôle à un utilisateur
  assignRole(newRole, assignedBy) {
    const allowedRoles = [
      "etudiant",
      "parent",
      "enseignant",
      "personnel",
      "comptable",
    ];

    if (assignedBy.role === "admin") {
      allowedRoles.push("sous-admin");
    }

    if (!allowedRoles.includes(newRole)) {
      throw new Error(`Rôle non autorisé: ${newRole}`);
    }

    this.role = newRole;
    this.assignedAt = new Date();
    this.createdBy = assignedBy.id;
    this.status = "active";
    this.updatedAt = new Date();
  }

  toJSON() {
    return {
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      role: this.role,
      telephone: this.telephone,
      adresse: this.adresse,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isActive: this.isActive,
      emailNotifications: this.emailNotifications,
      smsNotifications: this.smsNotifications,
      createdBy: this.createdBy,
      assignedAt: this.assignedAt,
      status: this.status,
    };
  }
}

module.exports = User;
