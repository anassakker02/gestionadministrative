const admin = require('firebase-admin');
const { uploadFileToFirebaseStorage } = require('./firebaseStorage');
const path = require('path');
const os = require('os');
const fs = require('fs');

const db = admin.firestore();

const backupCollections = async (collectionsToBackup, backupBaseName) => {
    const backupDetails = {};
    const bucket = admin.storage().bucket();

    for (const collectionName of collectionsToBackup) {
        try {
            const collectionRef = db.collection(collectionName);
            const snapshot = await collectionRef.get();
            const data = {};
            snapshot.forEach(doc => {
                data[doc.id] = doc.data();
            });

            const jsonFileName = `${collectionName}.json`;
            const tempFilePath = path.join(os.tmpdir(), jsonFileName);
            await fs.promises.writeFile(tempFilePath, JSON.stringify(data, null, 2));

            const storagePath = `backups/${backupBaseName}/${jsonFileName}`;
            const downloadUrl = await uploadFileToFirebaseStorage(tempFilePath, storagePath, 'application/json');

            fs.unlink(tempFilePath, (unlinkErr) => {
                if (unlinkErr) console.error(`Error deleting temporary file ${tempFilePath}:`, unlinkErr);
            });

            backupDetails[collectionName] = { status: 'completed', filePath: storagePath, downloadUrl };

        } catch (error) {
            console.error(`Error backing up collection ${collectionName}:`, error);
            backupDetails[collectionName] = { status: 'failed', error: error.message };
        }
    }
    return backupDetails;
};

const restoreCollection = async (collectionName, filePath) => {
    try {
        const bucket = admin.storage().bucket();
        const file = bucket.file(filePath);
        const [fileBuffer] = await file.download();
        const data = JSON.parse(fileBuffer.toString());

        const collectionRef = db.collection(collectionName);
        const batch = db.batch();
        let count = 0;

        for (const docId in data) {
            if (Object.hasOwnProperty.call(data, docId)) {
                batch.set(collectionRef.doc(docId), data[docId]);
                count++;
                if (count % 500 === 0) { // Firestore batch write limit is 500
                    await batch.commit();
                    batch = db.batch();
                }
            }
        }
        await batch.commit();
        return { status: 'completed', restoredCount: count };

    } catch (error) {
        console.error(`Error restoring collection ${collectionName}:`, error);
        throw error;
    }
};

module.exports = { backupCollections, restoreCollection };
