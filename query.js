const pool = require('./src/shared/config/db');
pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';", (err, res) => {
  console.log(res ? res.rows : err);
  pool.end();
});
