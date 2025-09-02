const admin = require('firebase-admin');
const serviceAccount = require('./admin.json');



admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://gestionadminastration-default-rtdb.europe-west1.firebasedatabase.app'
});

// Export Firestore instance
const db = admin.firestore();


module.exports = db; // Export Firestore instance





