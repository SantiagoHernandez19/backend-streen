const express = require('express');
const productController = require('./product.controller');

const router = express.Router();

// Ruta: GET /api/products
router.get('/', productController.getAll);

// Ruta: POST /api/products
router.post('/', productController.create);

module.exports = router;
