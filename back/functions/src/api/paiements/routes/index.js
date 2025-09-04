const router = require('express').Router();
const paiementController = require('../controllers');

// CRUD Paiements (Stripe & PayPal)
router.post('/', paiementController.create.bind(paiementController));
router.get('/', paiementController.getAll.bind(paiementController));
router.get('/:id', paiementController.getById.bind(paiementController));
router.put('/:id', paiementController.update.bind(paiementController));
router.delete('/:id', paiementController.delete.bind(paiementController));
