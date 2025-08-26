const router = require("express").Router();
const etudiantController = require("../controllers");

// CRUD complet des étudiants
router.post('/', etudiantController.create.bind(etudiantController));
router.get('/', etudiantController.getAll.bind(etudiantController));
router.get('/search', etudiantController.search.bind(etudiantController));
router.get('/stats', etudiantController.getStats.bind(etudiantController));
router.get('/classe/:classe_id', etudiantController.getByClasse.bind(etudiantController));
router.get('/:id', etudiantController.getById.bind(etudiantController));
router.put('/:id', etudiantController.update.bind(etudiantController));
router.delete('/:id', etudiantController.delete.bind(etudiantController));

module.exports = router;