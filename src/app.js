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

// (Acá en el futuro agregaremos las rutas, ej: app.use('/api/products', productRoutes))

module.exports = app;
