const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgres://streen_user:hXv6kR9v9u9h8y7t6r5e4w3q2a1s0d9f@dpg-cuj8k8568j0s7392j0g0-a.oregon-postgres.render.com/streen",
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to DB:', err);
  } else {
    console.log('Connected successfully:', res.rows[0]);
  }
  pool.end();
});
