const pool = require('../../shared/config/db');

class SaleService {
  async createSale(saleData) {
    const { 
      customer_email, 
      subtotal, 
      total, 
      metodo_pago, 
      metodo_envio, 
      direccion_envio,
      comprobante_url,
      items 
    } = saleData;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Insertar la venta (Cabecera)
      const saleQuery = `
        INSERT INTO sales (customer_email, subtotal, total, metodo_pago, metodo_envio, direccion_envio, comprobante_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id_venta, created_at
      `;
      const saleValues = [customer_email, subtotal, total, metodo_pago, metodo_envio, direccion_envio, comprobante_url];
      const { rows: saleRows } = await client.query(saleQuery, saleValues);
      const newSale = saleRows[0];

      // 2. Insertar los detalles y descontar stock
      for (const item of items) {
        // Insertar en sale_items
        const detailQuery = `
          INSERT INTO sale_items (id_venta, id_producto, talla, cantidad, precio_unitario, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        const subtotalItem = Number(item.cantidad) * Number(item.precio_unitario);
        await client.query(detailQuery, [
          newSale.id_venta, 
          item.id_producto, 
          item.talla, 
          item.cantidad, 
          item.precio_unitario,
          subtotalItem
        ]);

        // Descontar inventario general (stock) del producto
        const updateStockQuery = `
          UPDATE products 
          SET stock = GREATEST(stock - $1, 0)
          WHERE id_producto = $2
        `;
        await client.query(updateStockQuery, [item.cantidad, item.id_producto]);
      }

      await client.query('COMMIT');
      return newSale;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAllSales() {
    const query = `
      SELECT id_venta, customer_email, total, metodo_pago, metodo_envio, created_at, estado
      FROM sales
      ORDER BY id_venta DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
}

module.exports = new SaleService();
