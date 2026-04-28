const { uploadFileToFirebaseStorage } = require('../../../utils/firebaseStorage');
const multer = require('multer');

// ─── Whitelist MIME — seuls ces types sont autorisés ─────────────────────────
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

// Taille max : 5 Mo
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// ─── Configuration Multer avec filtrage MIME et limite de taille ──────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`Type de fichier non autorisé: ${file.mimetype}. Formats acceptés: PDF, JPEG, PNG.`));
    }
    cb(null, true);
  },
});

class UploadController {
  async uploadSingleFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ status: false, message: "Aucun fichier fourni." });
      }

      // Double vérification MIME côté serveur (defense in depth)
      if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
        return res.status(400).json({
          status: false,
          message: "Type de fichier non autorisé. Formats acceptés : PDF, JPEG, PNG.",
        });
      }

      // Vérification taille (Multer le fait aussi, mais on double)
      if (req.file.size > MAX_FILE_SIZE) {
        return res.status(400).json({
          status: false,
          message: "Fichier trop volumineux. Taille maximum : 5 Mo.",
        });
      }

      const fileUrl = await uploadFileToFirebaseStorage(req.file);
      return res.status(200).json({ status: true, message: "Fichier téléchargé avec succès", url: fileUrl });
    } catch (error) {
      // Ne pas exposer l'erreur interne
      console.error("Error uploading file:", error && error.message ? error.message : error);

      if (error && error.message && error.message.includes("non autorisé")) {
        return res.status(400).json({ status: false, message: error.message });
      }

      return res.status(500).json({ status: false, message: "Erreur lors du téléchargement du fichier." });
    }
  }
}

module.exports = { controller: new UploadController(), upload };
