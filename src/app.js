const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares Globales
app.use(cors());
app.use(express.json()); // Permite req.body en formato JSON

// Endpoint de prueba (Health Check indispensable para Render)
app.get('/', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API de Node.js + Express corriendo exitosamente' });
});

// Importamos las rutas de nuestros módulos (Features)
const categoryRoutes = require('./features/categories/category.routes');
const productRoutes = require('./features/products/product.routes');
const saleRoutes = require('./features/sales/sale.routes');

// Montamos las rutas (Asignando el prefijo /api)
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);

module.exports = app;
