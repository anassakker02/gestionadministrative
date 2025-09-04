const router = require('express').Router();
const factureController = require('../controllers');

// CRUD complet des factures
router.post('/', factureController.create.bind(factureController));
router.get('/', factureController.getAll.bind(factureController));
router.get('/search', factureController.search.bind(factureController));
router.get('/stats', factureController.getStats.bind(factureController));
router.get('/etudiant/:student_id', factureController.getByStudent.bind(factureController));
router.get('/statut/:statut', factureController.getByStatus.bind(factureController));
router.get('/:id', factureController.getById.bind(factureController));
router.put('/:id', factureController.update.bind(factureController));
router.delete('/:id', factureController.delete.bind(factureController));

module.exports = router;