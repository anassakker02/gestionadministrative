const router = require("express").Router(); // Module pour créer un nouveau route
const classeController = require("../controllers");

// router.post('/', userController.create.bind(userController));
router.get('/', classeController.getAll.bind(classeController));
router.get('/:id', classeController.getById.bind(classeController));
router.put('/:id', classeController.update.bind(classeController));
router.delete('/:id', classeController.delete.bind(classeController));



module.exports = router;