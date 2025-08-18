const router = require("express").Router(); // Module pour créer un nouveau route
const echeancierController = require("../controllers");

// router.post('/', userController.create.bind(userController));
router.get('/', echeancierController.getAll.bind(echeancierController));
router.get('/:id', echeancierController.getById.bind(echeancierController));
router.put('/:id', echeancierController.update.bind(echeancierController));
router.delete('/:id', echeancierController.delete.bind(echeancierController));



module.exports = router;