const router = require("express").Router(); // Module pour créer un nouveau route
const factureController = require("../controllers");


router.get('/', factureController.getAll.bind(factureController));
router.get('/:id', factureController.getById.bind(factureController));
router.put('/:id', factureController.update.bind(factureController));
router.delete('/:id', factureController.delete.bind(factureController));



module.exports = router;