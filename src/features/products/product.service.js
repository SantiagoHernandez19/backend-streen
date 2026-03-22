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

  async createProduct(productData) {
    const { id_categoria, nombre, descripcion, precio, precio_original, stock, tallas, colores, imagenes } = productData;
    const query = `
      INSERT INTO products (
        id_categoria, nombre, descripcion, precio, precio_original, 
        stock, tallas, colores, imagenes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `;
    
    // Convertimos los arrays/objetos a string literal tipo JSON para que PostgreSQL los acepte en las columnas JSONB
    const values = [
      id_categoria, nombre, descripcion, precio, precio_original || null, 
      stock || 0, JSON.stringify(tallas || []), JSON.stringify(colores || []), JSON.stringify(imagenes || [])
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async updateProduct(id, productData) {
    const { id_categoria, nombre, descripcion, precio, precio_original, stock, tallas, colores, imagenes } = productData;
    const query = `
      UPDATE products 
      SET id_categoria = $1, nombre = $2, descripcion = $3, precio = $4, precio_original = $5, 
          stock = $6, tallas = $7, colores = $8, imagenes = $9
      WHERE id_producto = $10
      RETURNING *
    `;
    const values = [
      id_categoria, nombre, descripcion, precio, precio_original || null, 
      stock || 0, JSON.stringify(tallas || []), JSON.stringify(colores || []), JSON.stringify(imagenes || []), 
      id
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  async deleteProduct(id) {
    const query = 'DELETE FROM products WHERE id_producto = $1 RETURNING *';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
}

module.exports = new ProductService();
