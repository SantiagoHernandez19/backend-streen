const pool = require('../../shared/config/db');

class ProductService {
  async getAllProducts() {
    // Consulta para traer los productos uniéndolo con el nombre de su categoría (INNER JOIN)
    const query = `
      SELECT p.*, c.nombre as categoria_nombre 
      FROM products p
      LEFT JOIN categories c ON p.id_categoria = c.id_categoria
      ORDER BY p.id_producto DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
}

module.exports = new ProductService();
