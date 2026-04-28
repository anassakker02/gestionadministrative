const admin = require('firebase-admin');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const bucket = admin.storage().bucket(
  process.env.FIREBASE_STORAGE_BUCKET || 'gestionadminastration.firebasestorage.app'
);

// ─── Whitelist MIME → extension autorisée ─────────────────────────────────────
const ALLOWED_MIME_TO_EXT = {
  'application/pdf': '.pdf',
  'image/jpeg':      '.jpg',
  'image/jpg':       '.jpg',
  'image/png':       '.png',
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

/**
 * Upload un fichier vers Firebase Storage avec validation de sécurité.
 * - Vérifie le type MIME (whitelist)
 * - Génère un nom de fichier aléatoire (UUID) — évite les path traversal
 * - Limite la taille à 5 Mo
 */
const uploadFileToFirebaseStorage = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('Aucun fichier fourni.'));
    }

    // Vérification MIME
    const allowedExt = ALLOWED_MIME_TO_EXT[file.mimetype];
    if (!allowedExt) {
      return reject(new Error(`Type de fichier non autorisé: ${file.mimetype}`));
    }

    // Vérification taille
    if (file.size > MAX_FILE_SIZE) {
      return reject(new Error('Fichier trop volumineux. Maximum 5 Mo.'));
    }

    // Nom de fichier sécurisé : UUID + extension issue du MIME (pas du nom original)
    // Évite les attaques de type "evil.pdf.js" ou path traversal
    const safeFilename = `${uuidv4()}${allowedExt}`;
    const blob = bucket.file(`documents/${safeFilename}`);

    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
        // Token Firebase pour accès public sécurisé
        metadata: { firebaseStorageDownloadTokens: uuidv4() },
      },
    });

    blobStream.on('error', (err) => {
      console.error('Erreur upload Firebase Storage:', err && err.message ? err.message : err);
      reject(new Error('Erreur lors du téléchargement du fichier.'));
    });

    blobStream.on('finish', () => {
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(blob.name)}?alt=media`;
      resolve(publicUrl);
    });

    blobStream.end(file.buffer);
  });
};

module.exports = { uploadFileToFirebaseStorage };
