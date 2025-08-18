const router = require("express").Router(); // Module pour créer un nouveau route
const parentController = require("../controllers");


router.get('/', parentController.getAll.bind(parentController));
router.get('/:id', parentController.getById.bind(parentController));
router.put('/:id', parentController.update.bind(parentController));
router.delete('/:id', parentController.delete.bind(parentController));



module.exports = router;