const pool = require('../../shared/config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  async login(email, password) {
    // 1. Buscar al usuario
    const query = `
      SELECT u.*, r.name as rol_name 
      FROM users u
      LEFT JOIN roles r ON u.id_rol = r.id_rol
      WHERE u.email = $1 AND u.is_active = true
    `;
    const { rows } = await pool.query(query, [email]);
    const user = rows[0];

    // 2. Verificar existencia y contraseña
    if (!user) throw new Error('Credenciales inválidas');
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) throw new Error('Credenciales inválidas');

    // 3. Generar Token Seguro
    // Usamos el secreto de las variables de entorno, o uno por defecto (para desarrollo)
    const token = jwt.sign(
      { id: user.id_user, email: user.email, rol: user.rol_name },
      process.env.JWT_SECRET || 'mi_super_secreto_desarrollo',
      { expiresIn: '8h' }
    );

    return {
      token,
      user: {
        id: user.id_user,
        nombre: `${user.first_name} ${user.last_name}`,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        rol: user.rol_name,
        id_rol: user.id_rol
      }
    };
  }

  async getAllUsers() {
    const query = `
      SELECT u.id_user, u.first_name, u.last_name, u.email, u.is_active, r.name as rol_name 
      FROM users u
      LEFT JOIN roles r ON u.id_rol = r.id_rol
      ORDER BY u.id_user DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // MÉTODO TEMPORAL DE EMERGENCIA
  async initDB() {
    await pool.query('DROP TABLE IF EXISTS users CASCADE;');
    await pool.query('DROP TABLE IF EXISTS roles CASCADE;');
    
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

    await pool.query(`
      INSERT INTO roles (name, description, permissions) VALUES 
      ('Administrador', 'Acceso total', '["dashboard", "clients", "categories", "sales", "products", "returns", "suppliers", "users", "purchases", "roles"]');
    `);

    await pool.query(`
      INSERT INTO users (first_name, last_name, email, password_hash, id_rol)
      VALUES ('Tiago', 'Admin', 'tiago@streen.com', '$2a$10$Ew.ItMlyyq4N.aT8lC1V2O8wOqIIfxP0/L9m8.Vn1z2L0U5XzN5yq', 1);
    `);
    
    return { message: "✅ Base de datos inicializada correctamente" };
  }
}

module.exports = new AuthService();
