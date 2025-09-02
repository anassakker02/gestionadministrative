const router = require('express').Router();
const fraisPonctuelController = require('../controllers');

// CRUD complet des frais ponctuels
router.post('/', fraisPonctuelController.create.bind(fraisPonctuelController));
router.get('/', fraisPonctuelController.getAll.bind(fraisPonctuelController));
router.get(
  '/:id',
  fraisPonctuelController.getById.bind(fraisPonctuelController)
);
router.put(
  '/:id',
  fraisPonctuelController.update.bind(fraisPonctuelController)
);
router.delete(
  '/:id',
  fraisPonctuelController.delete.bind(fraisPonctuelController)
);

module.exports = router;
