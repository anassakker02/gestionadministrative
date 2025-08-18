const router = require("express").Router(); // Module pour créer un nouveau route
const relanceController = require("../controllers");


router.get('/', relanceController.getAll.bind(relanceController));
router.get('/:id', relanceController.getById.bind(relanceController));
router.put('/:id', relanceController.update.bind(relanceController));
router.delete('/:id', relanceController.delete.bind(relanceController));



module.exports = router;