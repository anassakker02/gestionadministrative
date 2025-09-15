const router = require('express').Router();
const AuthController = require('../controllers');

router.post('/register', AuthController.register.bind(AuthController));
router.post('/login', AuthController.login.bind(AuthController));
// router.post('/verify_email', AuthController.verifyEmail);
router.post('/password_reset', AuthController.sendPasswordReset.bind(AuthController));


module.exports = router;