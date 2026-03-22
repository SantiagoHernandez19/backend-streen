const pool = require('./src/shared/config/db');

async function seed() {
  console.log("🚀 Iniciando siembra de base de datos...");
  try {
    // 1. Borramos lo viejo para que no haya conflictos de nombres
    await pool.query('DROP TABLE IF EXISTS users CASCADE;');
    await pool.query('DROP TABLE IF EXISTS roles CASCADE;');

    // 2. Creamos la tabla de Roles (en inglés)
    await pool.query(`
      CREATE TABLE roles (
          id_rol SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          permissions JSONB DEFAULT '[]',
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Creamos la tabla de Usuarios (con todos los campos de tu UI)
    await pool.query(`
      CREATE TABLE users (
          id_user SERIAL PRIMARY KEY,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(150) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          document_type VARCHAR(50),
          document_number VARCHAR(50),
          id_rol INT REFERENCES roles(id_rol),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Insertar de nuevo al admin con la clave 123456
    await pool.query(`
      INSERT INTO roles (name, description, permissions) VALUES 
      ('Administrador', 'Acceso total', '["dashboard", "clients", "categories", "sales", "products", "returns", "suppliers", "users", "purchases", "roles"]');
    `);

    await pool.query(`
      INSERT INTO users (first_name, last_name, email, password_hash, id_rol)
      VALUES ('Tiago', 'Admin', 'tiago@streen.com', '$2a$10$Ew.ItMlyyq4N.aT8lC1V2O8wOqIIfxP0/L9m8.Vn1z2L0U5XzN5yq', 1);
    `);

    console.log("✅ ¡Base de datos reiniciada con éxito (vía Script)!");
  } catch (err) {
    console.error("❌ Error sembrando la base de datos:", err);
  } finally {
    pool.end();
  }
}

seed();
