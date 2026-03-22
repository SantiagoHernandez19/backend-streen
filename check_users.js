const pool = require('./src/shared/config/db');
pool.query("SELECT id_user, email, first_name FROM users;", (err, res) => {
  if (err) {
    console.error("Error consultando usuarios:", err);
  } else {
    console.log("Usuarios en la base de datos:", res.rows);
  }
  pool.end();
});
