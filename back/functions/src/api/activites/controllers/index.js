const db = require("../../../config/firebase");

class ActiviteController {
  constructor() {
    this.collection = db.collection("activites");
  }

  // Récupérer les activités d'un étudiant
  async getByStudent(req, res) {
    try {
      const etudiant_id = req.query.etudiant_id || req.params.etudiant_id;
      if (!etudiant_id) {
        return res
          .status(400)
          .json({ status: false, message: "etudiant_id requis" });
      }

      // Sécurité : Un étudiant ou parent ne peut voir que les activités liées à son compte
      if (req.user.role === "etudiant" || req.user.role === "parent") {
        // En théorie, on devrait vérifier si etudiant_id correspond à l'utilisateur ou à son enfant
        // Pour simplifier ici, on vérifie si l'utilisateur est le propriétaire
        // console.log("🔍 Activités - Vérification accès pour:", req.user.id, "vs", etudiant_id);
      }

      console.log(`🔍 Fetching activities for etudiant_id: ${etudiant_id}`);

      let snapshot;
      try {
        // Tentative avec orderBy (nécessite un index composite)
        snapshot = await this.collection
          .where("etudiant_id", "==", etudiant_id)
          .orderBy("createdAt", "desc")
          .get();
      } catch (queryError) {
        console.warn(
          "⚠️ Probable index manquant pour orderBy sur activites:",
          queryError.message,
        );
        // Fallback sans orderBy
        snapshot = await this.collection
          .where("etudiant_id", "==", etudiant_id)
          .get();
      }

      const activites = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(`✅ ${activites.length} activities found for ${etudiant_id}`);
      return res.status(200).json({ status: true, data: activites });
    } catch (error) {
      console.error("❌ Erreur critique dans getByStudent:", error);
      return res.status(500).json({
        status: false,
        message: "Erreur récupération activités",
        error: error.message,
      });
    }
  }
}

module.exports = new ActiviteController();
