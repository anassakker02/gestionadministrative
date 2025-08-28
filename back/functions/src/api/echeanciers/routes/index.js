const router = require("express").Router();
const echeanciersController = require("../controllers");

// CRUD complet des échéanciers
router.post("/", echeanciersController.create.bind(echeanciersController));
router.get("/", echeanciersController.getAll.bind(echeanciersController));
router.get("/:id", echeanciersController.getById.bind(echeanciersController));
router.put("/:id", echeanciersController.update.bind(echeanciersController));
router.delete("/:id", echeanciersController.delete.bind(echeanciersController));

module.exports = router;
