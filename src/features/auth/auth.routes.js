const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

router.post('/login', authController.login);
router.get('/users', authController.getAll);
router.get('/init-db', authController.initDB);

module.exports = router;
