const express = require('express');
const productController = require('./product.controller');

const router = express.Router();

// Ruta: GET /api/products
router.get('/', productController.getAll);

module.exports = router;
