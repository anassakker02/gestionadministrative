const router = require("express").Router(); // Module pour créer un nouveau route
const tarifController = require("../controllers");


router.get('/', tarifController.getAll.bind(tarifController));
router.get('/:id', tarifController.getById.bind(tarifController));
router.put('/:id', tarifController.update.bind(tarifController));
router.delete('/:id', tarifController.delete.bind(tarifController));



module.exports = router;