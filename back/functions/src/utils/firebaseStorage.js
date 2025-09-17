const { Storage } = require('@google-cloud/storage');
const admin = require('firebase-admin');
const path = require('path');
const os = require('os');
const fs = require('fs');

const bucket = admin.storage().bucket('gestionadminastration.firebasestorage.app');

const uploadFileToFirebaseStorage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject('No file provided.');
    }

    const storage = new Storage();
    const gcsFileName = `${Date.now()}_${file.originalname}`;
    const blob = bucket.file(gcsFileName);
    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
      },
    });

    blobStream.on('error', (err) => {
      console.error('Error uploading file to Firebase Storage:', err);
      reject('Error uploading file to Firebase Storage.');
    });

    blobStream.on('finish', () => {
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(blob.name)}?alt=media`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};

module.exports = { uploadFileToFirebaseStorage };
