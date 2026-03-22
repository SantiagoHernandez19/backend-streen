const express = require('express');
const categoryController = require('./category.controller');

// Creamos un router específico para Categorías
const router = express.Router();

// Ruta: GET /api/categories
router.get('/', categoryController.getAll);

// Ruta: POST /api/categories
router.post('/', categoryController.create);

module.exports = router;
