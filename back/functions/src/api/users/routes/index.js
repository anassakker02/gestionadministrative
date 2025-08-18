const router = require("express").Router(); // Module pour créer un nouveau route
const usersController = require("../controllers");


router.get('/', usersController.getAll.bind(usersController));
router.get('/:id', usersController.getById.bind(usersController));
router.put('/:id', usersController.update.bind(usersController));
router.delete('/:id', usersController.delete.bind(usersController));



module.exports = router;