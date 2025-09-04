const router = require('express').Router();
const tarifsController = require('../controllers');

// CRUD complet des tarifs
router.post('/', tarifsController.create.bind(tarifsController));
router.get('/', tarifsController.getAll.bind(tarifsController));
router.get('/search', tarifsController.search.bind(tarifsController));
router.get('/stats', tarifsController.getStats.bind(tarifsController));
router.get('/:id', tarifsController.getById.bind(tarifsController));
router.put('/:id', tarifsController.update.bind(tarifsController));
router.delete('/:id', tarifsController.delete.bind(tarifsController));

module.exports = router;
