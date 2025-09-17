const { uploadFileToFirebaseStorage } = require('../../../utils/firebaseStorage');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

class UploadController {
  async uploadSingleFile(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ status: false, message: "Aucun fichier fourni." });
      }

      const fileUrl = await uploadFileToFirebaseStorage(req.file);

      return res.status(200).json({ status: true, message: "Fichier téléchargé avec succès", url: fileUrl });
    } catch (error) {
      console.error("Error uploading file:", error);
      return res.status(500).json({ status: false, message: "Erreur lors du téléchargement du fichier" });
    }
  }
}

module.exports = new UploadController();
