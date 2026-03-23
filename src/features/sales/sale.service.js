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
      const saleValues = [customer_email.toLowerCase().trim(), subtotal, total, metodo_pago, metodo_envio, direccion_envio, comprobante_url];
      const { rows: saleRows } = await client.query(saleQuery, saleValues);
      const newSale = saleRows[0];

      // 2. Insertar los detalles
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
        // Ya no descontamos stock aquí, se hará en el método que el Admin aprueba la venta
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
      SELECT 
        s.id_venta, 
        s.customer_email, 
        s.total, 
        s.metodo_pago, 
        s.metodo_envio, 
        s.created_at, 
        s.estado,
        COALESCE(
          json_agg(
            json_build_object(
              'id_producto', si.id_producto,
              'talla', si.talla,
              'cantidad', si.cantidad,
              'precio_unitario', si.precio_unitario
            )
          ) FILTER (WHERE si.id_detalle IS NOT NULL), '[]'
        ) AS productos
      FROM sales s
      LEFT JOIN sale_items si ON s.id_venta = si.id_venta
      GROUP BY s.id_venta
      ORDER BY s.id_venta DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  async approveSale(id_venta) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Cambiar estado a 'Aprobada'
      const updateSaleQuery = `UPDATE sales SET estado = 'Aprobada' WHERE id_venta = $1 RETURNING *`;
      const { rows: saleRows } = await client.query(updateSaleQuery, [id_venta]);
      
      if (saleRows.length === 0) throw new Error('Venta no encontrada');

      // 2. Traer los items de la venta
      const getItemsQuery = `SELECT id_producto, cantidad FROM sale_items WHERE id_venta = $1`;
      const { rows: items } = await client.query(getItemsQuery, [id_venta]);

      // 3. Descontar el stock por cada item
      for (const item of items) {
        const updateStockQuery = `
          UPDATE products 
          SET stock = GREATEST(stock - $1, 0)
          WHERE id_producto = $2
        `;
        await client.query(updateStockQuery, [item.cantidad, item.id_producto]);
      }

      // 4. Ascender al usuario de "Usuario" a "Cliente" automáticamente si es su primera aprobación
      const userUpdateQuery = `
        UPDATE users 
        SET id_rol = (SELECT id_rol FROM roles WHERE name = 'Cliente' LIMIT 1)
        WHERE email = $1 
        AND id_rol = (SELECT id_rol FROM roles WHERE name = 'Usuario' LIMIT 1)
      `;
      await client.query(userUpdateQuery, [saleRows[0].customer_email]);

      await client.query('COMMIT');
      return saleRows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new SaleService();
