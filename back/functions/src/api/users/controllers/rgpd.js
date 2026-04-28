/**
 * rgpd.js — Endpoints RGPD (Règlement Général sur la Protection des Données)
 * - Droit d'accès : GET /users/:id/export
 * - Droit à l'effacement : DELETE /users/:id/data
 * - Droit de portabilité : export JSON des données personnelles
 */
const db = require("../../../config/firebase");
const { decrypt } = require("../../../utils/encryption");
const AuditLog = require("../../../classes/AuditLog");

class RGPDController {
  /**
   * Droit d'accès — exporte toutes les données personnelles d'un utilisateur
   * GET /v1/users/:id/export
   */
  async exportUserData(req, res) {
    try {
      const { id } = req.params;

      // Seul l'admin ou l'utilisateur lui-même peut exporter
      if (req.user.id !== id && req.user.role !== "admin") {
        return res.status(403).json({ status: false, message: "Accès refusé." });
      }

      const userDoc = await db.collection("users").doc(id).get();
      if (!userDoc.exists) {
        return res.status(404).json({ status: false, message: "Utilisateur non trouvé." });
      }

      const userData = userDoc.data();

      // Déchiffrer les données sensibles pour l'export
      const exportData = {
        id,
        email: userData.email,
        nom: userData.nom,
        prenom: userData.prenom,
        role: userData.role,
        createdAt: userData.createdAt,
        telephone: userData.telephone ? decrypt(userData.telephone) : null,
        adresse: userData.adresse ? decrypt(userData.adresse) : null,
      };

      // Récupérer les paiements liés
      const paiementsSnap = await db.collection("paiements")
        .where("etudiant_id", "==", id).get();
      exportData.paiements = paiementsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Log RGPD
      await new AuditLog({
        userId: req.user.id,
        action: "RGPD_EXPORT",
        entityType: "User",
        entityId: id,
        details: { requestedBy: req.user.id },
      }).save();

      return res.status(200).json({
        status: true,
        message: "Export RGPD — données personnelles",
        exportedAt: new Date().toISOString(),
        data: exportData,
      });
    } catch (error) {
      console.error("RGPD export error:", error && error.message);
      return res.status(500).json({ status: false, message: "Erreur lors de l'export." });
    }
  }

  /**
   * Droit à l'effacement — anonymise les données personnelles
   * DELETE /v1/users/:id/data
   * Note : on anonymise plutôt qu'on supprime pour garder la cohérence financière
   */
  async anonymizeUserData(req, res) {
    try {
      const { id } = req.params;

      // Seul l'admin peut anonymiser
      if (req.user.role !== "admin") {
        return res.status(403).json({ status: false, message: "Accès refusé. Réservé aux administrateurs." });
      }

      const userDoc = await db.collection("users").doc(id).get();
      if (!userDoc.exists) {
        return res.status(404).json({ status: false, message: "Utilisateur non trouvé." });
      }

      // Anonymisation des données personnelles (RGPD Art. 17)
      await db.collection("users").doc(id).update({
        email: `anonymized_${id}@deleted.invalid`,
        nom: "Anonymisé",
        prenom: "Anonymisé",
        telephone: null,
        adresse: null,
        isActive: false,
        anonymizedAt: new Date(),
        updatedAt: new Date(),
      });

      // Log RGPD
      await new AuditLog({
        userId: req.user.id,
        action: "RGPD_ANONYMIZE",
        entityType: "User",
        entityId: id,
        details: { anonymizedBy: req.user.id },
      }).save();

      return res.status(200).json({
        status: true,
        message: "Données personnelles anonymisées conformément au RGPD (Art. 17).",
      });
    } catch (error) {
      console.error("RGPD anonymize error:", error && error.message);
      return res.status(500).json({ status: false, message: "Erreur lors de l'anonymisation." });
    }
  }
}

module.exports = new RGPDController();
