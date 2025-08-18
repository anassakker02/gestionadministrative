const router = require("express").Router(); // Module pour créer un nouveau route
const etudiantController = require("../controllers");


router.get('/', etudiantController.getAll.bind(etudiantController));
router.get('/:id', etudiantController.getById.bind(etudiantController));
router.put('/:id', etudiantController.update.bind(etudiantController));
router.delete('/:id', etudiantController.delete.bind(etudiantController));



module.exports = router;