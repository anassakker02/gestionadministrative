// firebaseController.js
const admin = require('firebase-admin');
const db = require('../config/firebase');


class FirebaseController {
    constructor() {
        // Initialisez Firebase
      this.db =db;
    }

    async create(collection, data) {

        const docRef = this.db.collection(collection).doc();
    try{
            
         await docRef.set(JSON.parse(JSON.stringify(data)));
        
         return docRef.id;


    } catch (error) {
        console.error('Erreur lors de l\'écriture dans Firestore :', error);
    }
    }

    async find(collection, criteria) {
        try {
            let query = this.db.collection(collection); // Initialise la requête sur la collection

            // Ajoute chaque critère à la requête
            Object.keys(criteria).forEach(key => {
                query = query.where(key, '==', criteria[key]);
            });

            const snapshot = await query.get(); // Exécute la requête

            if (snapshot.empty) {
                console.log('Aucun document trouvé avec ces critères.');
                return null;
            }

            // Retourne le premier document trouvé
            const result = snapshot.docs[0];
            return { id: result.id, ...result.data() };
        } catch (error) {
            console.error('Erreur lors de la recherche de documents :', error);
            throw error;
        }
    }


    async getAll(collection) {
        try {
            const snapshot = await this.db.collection(collection).get();
            if (snapshot.empty) {
                console.log('Aucun document correspondant');
                return;
            }  

            let data = [];
            snapshot.forEach(doc => {
                let id = doc.id;
                let docData = doc.data();
                data.push({id, ...docData});
            });

            return data;
        } catch (error) {
            console.error('Erreur lors de la récupération de tous les documents de Firestore :', error);
        }
    }

   /* async read(collection, id) {
        const docRef = this.db.collection(collection).doc(id);
        try {
            let doc = await docRef.get();
            if (doc.exists) {
                return doc.data();
            } else {
                throw new Error('Aucun document correspondant');
            }
        } catch (error) {
            console.error('Erreur lors de la lecture de Firestore :', error);
        }
    }*/

        async read(collection, id) {
            if (!id || id.trim() === '') {
                throw new Error('Invalid document ID provided');
            }
        
            const docRef = this.db.collection(collection).doc(id.trim());
            try {
                let doc = await docRef.get();
                if (doc.exists) {
                    return doc.data();
                } else {
                    return null; // Document non trouvé
                }
            } catch (error) {
                console.error('Error reading Firestore document:', error.message);
                throw error;
            }
        }    

    async update(collection, id, data) {
        const docRef = this.db.collection(collection).doc(id);
        try {
            await docRef.update(JSON.parse(JSON.stringify(data)));
        } catch (error) {
            console.error('Erreur lors de la mise à jour de Firestore :', error);
        }
    }

    async delete(collection, id) {
        const docRef = this.db.collection(collection).doc(id);
        try {
            await docRef.delete();
        } catch (error) {
            console.error('Erreur lors de la suppression de Firestore :', error);
        }
    }
}



module.exports = FirebaseController;