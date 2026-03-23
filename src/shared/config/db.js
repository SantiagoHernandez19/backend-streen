require('dotenv').config();
const { Pool } = require('pg');

// Usamos el DATABASE_URL que Render nos da (o el local)
const pool = new Pool({
  // Prioriza la conexión interna de Render (DATABASE_URL), si no existe usa la externa
  connectionString: process.env.DATABASE_URL || "postgres://streen_user:hXv6kR9v9u9h8y7t6r5e4w3q2a1s0d9f@dpg-cuj8k8568j0s7392j0g0-a.oregon-postgres.render.com/streen",
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
