const express = require('express');
const router = express.Router();
const saleController = require('./sale.controller');

router.post('/', saleController.create);
router.get('/', saleController.getAll);

module.exports = router;
