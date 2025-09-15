const router = require('express').Router();
const dashboardControllers = require('../controllers');

router.get('/', dashboardControllers.getDashboardStats);

module.exports = router;
