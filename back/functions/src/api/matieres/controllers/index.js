const db = require("../../../config/firebase");

class MatiereController {
  constructor() {
    this.collection = db.collection("matieres");
  }

  async getAll(req, res) {
    const snapshot = await this.collection.get();
    const matieres = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json({ status: true, data: matieres });
  }

  async create(req, res) {
    const { nom } = req.body;
    if (!nom)
      return res.status(400).json({ status: false, message: "Nom requis." });
    const matiere = { nom, createdAt: new Date() };
    const docRef = await this.collection.add(matiere);
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

module.exports = new MatiereController();
