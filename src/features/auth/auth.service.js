const pool = require('../../shared/config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  async login(email, password) {
    // 1. Buscar al usuario
    const query = `
      SELECT u.*, r.name as rol_name, r.permissions as permissions
      FROM users u
      LEFT JOIN roles r ON u.id_rol = r.id_rol
      WHERE u.email = $1 AND u.is_active = true
    `;
    const { rows } = await pool.query(query, [email.toLowerCase().trim()]);
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
        phone: user.phone,
        department: user.department,
        city: user.city,
        address: user.address,
        document_type: user.document_type,
        document_number: user.document_number,
        rol: user.rol_name,
        id_rol: user.id_rol,
        permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : (user.permissions || [])
      }
    };
  }

  async register(userData) {
    const { first_name, last_name, email, password, document_type, document_number } = userData;

    const cleanEmail = email.toLowerCase().trim();
    // 1. Verificar si el email ya existe
    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [cleanEmail]);
    if (exists.rowCount > 0) throw new Error('El correo ya está registrado');

    // 2. Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // ASEGURAR QUE LOS ROLES EXISTEN (por si no se han creado)
    await pool.query("INSERT INTO roles (name, description) VALUES ('Usuario', 'Cliente recién registrado') ON CONFLICT (name) DO NOTHING");
    await pool.query("INSERT INTO roles (name, description) VALUES ('Cliente', 'Comprador verificado') ON CONFLICT (name) DO NOTHING");

    // 3. Insertar usuario con rol predeterminado 'Usuario' si no viene uno
    const query = `
      INSERT INTO users (first_name, last_name, email, password_hash, document_type, document_number, phone, department, city, address, id_rol)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, COALESCE($11, (SELECT id_rol FROM roles WHERE name = 'Usuario' LIMIT 1)))
      RETURNING id_user, email, first_name
    `;
    const { rows } = await pool.query(query, [
      first_name, 
      last_name, 
      cleanEmail, 
      hash, 
      document_type, 
      document_number, 
      userData.phone || null,
      userData.department || null,
      userData.city || null,
      userData.address || null,
      userData.id_rol || null
    ]);
    
    return rows[0];
  }

  async updateUser(id, userData) {
    const { first_name, last_name, email, id_rol, is_active, document_type, document_number, phone, department, city, address } = userData;

    const query = `
      UPDATE users 
      SET first_name = $1, last_name = $2, email = $3, id_rol = $4, is_active = $5,
          document_type = $6, document_number = $7, phone = $8, department = $9, city = $10, address = $11
      WHERE id_user = $12
      RETURNING id_user, first_name, last_name, email, document_type, document_number, phone, department, city, address, id_rol, is_active
    `;
    const { rows } = await pool.query(query, [
      first_name, last_name, email, id_rol, is_active, 
      document_type, document_number, phone, department, city, address, id
    ]);
    return rows[0];
  }

  async updateProfile(id, profileData) {
    const { name, first_name, last_name, document_type, document_number, phone, department, city, address } = profileData;
    
    // Si viene 'name' (nombre completo), intentamos dividirlo
    let finalFirstName = first_name;
    let finalLastName = last_name;
    
    if (name && !first_name && !last_name) {
      const parts = name.trim().split(' ');
      finalFirstName = parts[0];
      finalLastName = parts.slice(1).join(' ') || '';
    }

    const query = `
      UPDATE users 
      SET first_name = $1, last_name = $2, document_type = $3, document_number = $4, 
          phone = $5, department = $6, city = $7, address = $8
      WHERE id_user = $9
      RETURNING id_user, first_name, last_name, email, document_type, document_number, phone, department, city, address
    `;
    const { rows } = await pool.query(query, [
      finalFirstName, finalLastName, document_type, document_number, 
      phone, department, city, address, id
    ]);
    
    if (rows.length === 0) throw new Error('Usuario no encontrado');
    
    // Devolvemos el usuario con el formato que espera el frontend
    const user = rows[0];
    return {
      id: user.id_user,
      first_name: user.first_name,
      last_name: user.last_name,
      nombre: `${user.first_name} ${user.last_name}`,
      email: user.email,
      document_type: user.document_type,
      document_number: user.document_number,
      phone: user.phone,
      department: user.department,
      city: user.city,
      address: user.address
    };
  }

  async deleteUser(id) {
    // No permitir borrar al admin principal (id=1)
    if (parseInt(id) === 1) throw new Error('No se puede eliminar al administrador principal');
    
    const query = 'DELETE FROM users WHERE id_user = $1';
    await pool.query(query, [id]);
    return true;
  }

  async getAllUsers() {
    const query = `
      SELECT u.id_user, u.first_name, u.last_name, u.email, u.is_active, r.name as rol_name 
      FROM users u
      LEFT JOIN roles r ON u.id_rol = r.id_rol
      ORDER BY u.id_user ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async getAllRoles() {
    const query = 'SELECT * FROM roles ORDER BY id_rol ASC';
    const { rows } = await pool.query(query);
    return rows;
  }

  async createRole(roleData) {
    const { name, description, permissions } = roleData;
    const query = `
      INSERT INTO roles (name, description, permissions)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const perms = typeof permissions === 'string' ? permissions : JSON.stringify(permissions);
    const { rows } = await pool.query(query, [name, description, perms]);
    return rows[0];
  }

  async updateRole(id, roleData) {
    const { name, description, permissions, is_active } = roleData;
    const perms = typeof permissions === 'string' ? permissions : JSON.stringify(permissions);
    const query = `
      UPDATE roles 
      SET name = $1, description = $2, permissions = $3, is_active = $4
      WHERE id_rol = $5
      RETURNING *
    `;
    const { rows } = await pool.query(query, [name, description, perms, is_active, id]);
    return rows[0];
  }

  async deleteRole(id) {
    // Primero verificar si hay usuarios con este rol
    const checkQuery = 'SELECT COUNT(*) FROM users WHERE id_rol = $1';
    const { rows: checkRows } = await pool.query(checkQuery, [id]);
    if (parseInt(checkRows[0].count) > 0) {
      throw new Error('No se puede eliminar un rol que tiene usuarios asignados');
    }

    const query = 'DELETE FROM roles WHERE id_rol = $1';
    await pool.query(query, [id]);
    return true;
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
          phone VARCHAR(20),
          department VARCHAR(100),
          city VARCHAR(100),
          address TEXT,
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

      // 5. Agregar columnas nuevas a usuarios
      await pool.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS department VARCHAR(100),
        ADD COLUMN IF NOT EXISTS city VARCHAR(100),
        ADD COLUMN IF NOT EXISTS address TEXT;
      `);

      return { message: "✅ Reparación completa: Tablas actualizadas con campos de perfil" };
    } catch (err) {
      throw new Error("Error reparando DB: " + err.message);
    }
  }
}

module.exports = new AuthService();
