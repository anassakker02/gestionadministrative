const router = require("express").Router(); // Module pour créer un nouveau route
const bourseController = require("../controllers");

// CRUD complet des bourses
router.post('/', bourseController.create.bind(bourseController));
router.get('/', bourseController.getAll.bind(bourseController));
router.get('/search', bourseController.search.bind(bourseController));
router.get('/stats', bourseController.getStats.bind(bourseController));
router.get('/:id', bourseController.getById.bind(bourseController));
router.put('/:id', bourseController.update.bind(bourseController));
router.delete('/:id', bourseController.delete.bind(bourseController));


module.exports = router;