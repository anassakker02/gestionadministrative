const router = require('express').Router();
const relancesController = require('../controllers');

// CRUD complet des relances
router.post('/', relancesController.create.bind(relancesController));
router.get('/', relancesController.getAll.bind(relancesController));
router.get('/:id', relancesController.getById.bind(relancesController));
router.put('/:id', relancesController.update.bind(relancesController));
router.delete('/:id', relancesController.delete.bind(relancesController));

module.exports = router;
