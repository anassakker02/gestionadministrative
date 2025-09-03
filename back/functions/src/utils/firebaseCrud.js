// firebaseCrud.js
//const admin = require('firebase-admin'); // garde l'import si tu veux utiliser admin plus tard
const db = require('../config/firebase');

class FirebaseController {
  constructor() {
    this.db = db;
  }

  async create(collection, data) {
    const docRef = this.db.collection(collection).doc();
    try {
      await docRef.set(JSON.parse(JSON.stringify(data)));
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de l\'écriture dans Firestore :', error);
      return null;
    }
  }

  async find(collection, criteria) {
    try {
      let query = this.db.collection(collection);

      Object.keys(criteria).forEach(key => {
        query = query.where(key, '==', criteria[key]);
      });

      const snapshot = await query.get();

      if (snapshot.empty) {
        console.log('Aucun document trouvé avec ces critères.');
        return null;
      }

      // Retourne le premier document trouvé
      return snapshot.docs[0].data();
    } catch (error) {
      console.error('Erreur lors de la lecture dans Firestore :', error);
      return null;
    }
  }
}

module.exports = new FirebaseController();

