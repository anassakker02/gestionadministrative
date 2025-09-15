const router = require("express").Router();
const activiteController = require('../controllers');

// GET /activites?etudiant_id=...
router.get("/", activiteController.getByStudent.bind(activiteController));

module.exports = router;
