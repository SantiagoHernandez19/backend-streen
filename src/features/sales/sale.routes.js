const express = require('express');
const router = express.Router();
const saleController = require('./sale.controller');

router.post('/', saleController.create);
router.get('/', saleController.getAll);
router.put('/:id/approve', saleController.approve);

module.exports = router;
