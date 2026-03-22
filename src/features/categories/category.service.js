const pool = require('../../shared/config/db');

class CategoryService {
  async getAllCategories() {
    // Consulta para traer todas las categorías ordenadas por nombre
    const query = 'SELECT * FROM categories ORDER BY nombre ASC';
    const { rows } = await pool.query(query);
    return rows;
  }

  // (Más adelante podemos agregar createCategory, updateCategory, getCategoryById)
}

module.exports = new CategoryService();
