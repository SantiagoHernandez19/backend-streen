const pool = require('../../shared/config/db');

class CategoryService {
  async getAllCategories() {
    // Consulta para traer todas las categorías ordenadas por nombre
    const query = 'SELECT * FROM categories ORDER BY nombre ASC';
    const { rows } = await pool.query(query);
    return rows;
  }

  async createCategory(categoryData) {
    const { nombre, descripcion } = categoryData;
    const query = 'INSERT INTO categories (nombre, descripcion) VALUES ($1, $2) RETURNING *';
    const { rows } = await pool.query(query, [nombre, descripcion]);
    return rows[0];
  }

  // (Más adelante podemos agregar updateCategory, getCategoryById)
}

module.exports = new CategoryService();
