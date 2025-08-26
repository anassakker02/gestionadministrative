const router = require("express").Router();
const classeController = require("../controllers");

// CRUD complet des classes
router.post('/', classeController.create.bind(classeController));
router.get('/', classeController.getAll.bind(classeController));
router.get('/search', classeController.search.bind(classeController));
router.get('/stats', classeController.getStats.bind(classeController));
router.get('/niveau/:niveau', classeController.getByNiveau.bind(classeController));
router.get('/annee/:annee_scolaire', classeController.getByAnnee.bind(classeController));
router.get('/:id', classeController.getById.bind(classeController));
router.put('/:id', classeController.update.bind(classeController));
router.delete('/:id', classeController.delete.bind(classeController));

module.exports = router;