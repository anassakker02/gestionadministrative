const router = require("express").Router();
const matiereController = require("../controllers");

router.get("/", matiereController.getAll.bind(matiereController));
router.post("/", matiereController.create.bind(matiereController));
router.put("/:id", matiereController.update.bind(matiereController));
router.delete("/:id", matiereController.delete.bind(matiereController));

module.exports = router;
