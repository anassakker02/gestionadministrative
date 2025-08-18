const router = require("express").Router(); // Module pour créer un nouveau route
const bourseController = require("../controllers");

// router.post('/', userController.create.bind(userController));
router.get('/', bourseController.getAll.bind(bourseController));
router.get('/:id', bourseController.getById.bind(bourseController));
router.put('/:id', bourseController.update.bind(bourseController));
router.delete('/:id', bourseController.delete.bind(bourseController));



module.exports = router;