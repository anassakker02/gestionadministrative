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
      const snapshot = await this.collection
        .where("etudiant_id", "==", etudiant_id)
        .orderBy("createdAt", "desc")
        .get();
      const activites = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return res.status(200).json({ status: true, data: activites });
    } catch (error) {
      return res
        .status(500)
        .json({
          status: false,
          message: "Erreur récupération activités",
          error: error.message,
        });
    }
  }
}

module.exports = new ActiviteController();
