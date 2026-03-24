const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/users', authController.getAll);
router.put('/users/:id', authController.updateUser);
router.put('/profile/:id', authController.updateProfile);
router.delete('/users/:id', authController.deleteUser);
router.get('/roles', authController.getAllRoles);
router.post('/roles', authController.createRole);
router.put('/roles/:id', authController.updateRole);
router.delete('/roles/:id', authController.deleteRole);
router.get('/init-db', authController.initDB);
router.get('/fix-db', authController.fixDB);

module.exports = router;
