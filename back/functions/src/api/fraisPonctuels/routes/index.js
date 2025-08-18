const router = require("express").Router(); // Module pour créer un nouveau route
const fraisPonctuelsController = require("../controllers");


router.get('/', fraisPonctuelsController.getAll.bind(fraisPonctuelsController));
router.get('/:id', fraisPonctuelsController.getById.bind(fraisPonctuelsController));
router.put('/:id', fraisPonctuelsController.update.bind(fraisPonctuelsController));
router.delete('/:id', fraisPonctuelsController.delete.bind(fraisPonctuelsController));



module.exports = router;