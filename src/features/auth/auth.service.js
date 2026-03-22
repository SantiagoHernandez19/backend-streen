const pool = require('../../shared/config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AuthService {
  async login(email, password) {
    // 1. Buscar al usuario
    const query = `
      SELECT u.*, r.nombre as rol_nombre 
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
      { id: user.id_user, email: user.email, rol: user.rol_nombre },
      process.env.JWT_SECRET || 'mi_super_secreto_desarrollo',
      { expiresIn: '8h' }
    );

    return {
      token,
      user: {
        id: user.id_user,
        nombre: user.nombre,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        rol: user.rol_nombre,
        id_rol: user.id_rol
      }
    };
  }

  async getAllUsers() {
    const query = `
      SELECT u.id_user, u.nombre, u.email, u.is_active, r.nombre as rol_nombre 
      FROM users u
      LEFT JOIN roles r ON u.id_rol = r.id_rol
      ORDER BY u.id_user DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
}

module.exports = new AuthService();
