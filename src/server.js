const pool = require('./shared/config/db');
const app = require('./app');

// Definir el puerto asignado por Render o el 10000 para local
const PORT = process.env.PORT || 10000;

// Probar conexión a la base de datos antes de arrancar la API
pool.connect()
  .then(client => {
    console.log('✅ Conexión a PostgreSQL establecida exitosamente.');
    client.release();
    
    // Iniciar el servidor Express
    app.listen(PORT, () => {
      console.log(`🚀 Servidor API corriendo en puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error al conectar con PostgreSQL:', err.stack);
    // Si la DB no está (por ejemplo, variable DATABASE_URL mal), la app de Render fallará ruidosamente para notarte el error:
    process.exit(-1);
  });
