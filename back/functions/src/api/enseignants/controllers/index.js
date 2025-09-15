const db = require("../../../config/firebase");

class EnseignantController {
  constructor() {
    this.collection = db.collection("enseignants");
  }

  async getAll(req, res) {
    const snapshot = await this.collection.get();
    const enseignants = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json({ status: true, data: enseignants });
  }

  async create(req, res) {
    const { nom, prenom, email, matiere } = req.body;
    if (!nom || !prenom || !email)
      return res
        .status(400)
        .json({ status: false, message: "Champs requis manquants." });
    const enseignant = { nom, prenom, email, matiere, createdAt: new Date() };
    const docRef = await this.collection.add(enseignant);
    res.status(201).json({ status: true, id: docRef.id });
  }

  async update(req, res) {
    const { id } = req.params;
    const updateData = req.body;
    await this.collection.doc(id).update(updateData);
    res.status(200).json({ status: true });
  }

  async delete(req, res) {
    const { id } = req.params;
    await this.collection.doc(id).delete();
    res.status(200).json({ status: true });
  }
}

module.exports = new EnseignantController();
