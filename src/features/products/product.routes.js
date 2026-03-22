const express = require('express');
const productController = require('./product.controller');

const router = express.Router();

// Ruta: GET /api/products
router.get('/', productController.getAll);

// Ruta: POST /api/products
router.post('/', productController.create);

// Ruta: PUT /api/products/:id
router.put('/:id', productController.update);

// Ruta: DELETE /api/products/:id
router.delete('/:id', productController.delete);

module.exports = router;
