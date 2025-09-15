const router = require("express").Router();
const enseignantController = require("../controllers");

router.get("/", enseignantController.getAll.bind(enseignantController));
router.post("/", enseignantController.create.bind(enseignantController));
router.put("/:id", enseignantController.update.bind(enseignantController));
router.delete("/:id", enseignantController.delete.bind(enseignantController));

module.exports = router;
