require('dotenv').config();
const { Pool } = require('pg');

// Usamos el DATABASE_URL que Render nos da (o el local)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Fundamental en Render Postgres
  }
});

module.exports = pool;
