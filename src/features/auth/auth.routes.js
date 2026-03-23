const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/users', authController.getAll);
router.get('/init-db', authController.initDB);
router.get('/fix-db', authController.fixDB);

module.exports = router;
