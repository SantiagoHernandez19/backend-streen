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

  async register(userData) {
    const { first_name, last_name, email, password } = userData;

    // 1. Verificar si el email ya existe
    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rowCount > 0) throw new Error('El correo ya está registrado');

    // 2. Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // 3. Insertar usuario (por defecto rol de cliente o el que corresponda)
    // Asumimos que el primer rol es Admin, el resto clientes? 
    // Por ahora lo pongo con un id_rol manual si no viene, o nulo.
    const query = `
      INSERT INTO users (first_name, last_name, email, password_hash, id_rol)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id_user, email, first_name
    `;
    const { rows } = await pool.query(query, [first_name, last_name, email, hash, userData.id_rol || null]);
    
    return rows[0];
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

  // MÉTODO TEMPORAL DE EMERGENCIA (BORRA Y CREA TODO)
  async initDB() {
    await pool.query('DROP TABLE IF EXISTS products CASCADE;');
    await pool.query('DROP TABLE IF EXISTS categories CASCADE;');
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
      CREATE TABLE categories (
          id_categoria SERIAL PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          descripcion TEXT,
          is_active BOOLEAN DEFAULT true
      );
    `);

    await pool.query(`
      CREATE TABLE products (
          id_producto SERIAL PRIMARY KEY,
          id_categoria INT REFERENCES categories(id_categoria),
          nombre VARCHAR(255) NOT NULL,
          descripcion TEXT,
          precio_normal NUMERIC(10,2) NOT NULL,
          precio_descuento NUMERIC(10,2),
          stock INT DEFAULT 0,
          tallas JSONB DEFAULT '[]',
          colores JSONB DEFAULT '[]',
          imagenes JSONB DEFAULT '[]',
          has_discount BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query("INSERT INTO categories (nombre) VALUES ('BEISBOLERA PREMIUM'), ('BEISBOLERA CLASICA'), ('GORRO FRIO');");

    await pool.query(`
      INSERT INTO roles (name, description, permissions) VALUES 
      ('Administrador', 'Acceso total', '["dashboard", "clients", "categories", "sales", "products", "returns", "suppliers", "users", "purchases", "roles"]');
    `);

    const bcrypt = require('bcryptjs');
    const adminHash = await bcrypt.hash('admin123', 10);
    
    await pool.query(`
      INSERT INTO users (first_name, last_name, email, password_hash, id_rol)
      VALUES ('Tiago', 'Admin', 'tiago@streen.com', $1, 1);
    `, [adminHash]);
    
    const { rows } = await pool.query('SELECT id_user, email, first_name FROM users');
    
    return { 
      message: "✅ Base de datos (Tablas completas) inicializada correctamente",
      users: rows 
    };
  }

  async fixDB() {
    console.log("🛠 Iniciando reparación de tablas...");
    try {
      // 1. Crear tabla de categorías si no existe
      await pool.query(`
        CREATE TABLE IF NOT EXISTS categories (
            id_categoria SERIAL PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            descripcion TEXT,
            is_active BOOLEAN DEFAULT true
        );
      `);

      // 2. Insertar categorías base si está vacía
      const { rowCount } = await pool.query('SELECT 1 FROM categories LIMIT 1');
      if (rowCount === 0) {
        await pool.query("INSERT INTO categories (nombre) VALUES ('BEISBOLERA PREMIUM'), ('BEISBOLERA CLASICA'), ('GORRO FRIO');");
      }

      // 3. Renombrar columnas viejas si existen para no perder datos
      try {
        await pool.query('ALTER TABLE products RENAME COLUMN precio TO precio_normal;');
        await pool.query('ALTER TABLE products RENAME COLUMN precio_original TO precio_descuento;');
      } catch (e) {
        console.log("Nota: Las columnas ya tenían los nombres correctos o no existían.");
      }

      // 4. Agregar columnas nuevas a productos
      await pool.query(`
        ALTER TABLE products 
        ADD COLUMN IF NOT EXISTS precio_normal NUMERIC(10,2),
        ADD COLUMN IF NOT EXISTS precio_descuento NUMERIC(10,2),
        ADD COLUMN IF NOT EXISTS colores JSONB DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS has_discount BOOLEAN DEFAULT false;
      `);

      return { message: "✅ Reparación completa: Tabla de categorías creada y tabla de productos actualizada" };
    } catch (err) {
      throw new Error("Error reparando DB: " + err.message);
    }
  }
}

module.exports = new AuthService();
