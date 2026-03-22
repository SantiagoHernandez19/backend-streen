const saleService = require('./sale.service');

class SaleController {
  async create(req, res) {
    try {
      const saleData = req.body;
      const newSale = await saleService.createSale(saleData);
      
      res.status(201).json({
        status: 'success',
        message: 'Venta procesada exitosamente',
        data: { sale: newSale }
      });
    } catch (error) {
      console.error('Error al procesar la venta:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'Ocurrió un error en el servidor al registrar la venta',
        detail: error.message
      });
    }
  }

  async getAll(req, res) {
    try {
      const sales = await saleService.getAllSales();
      res.json({
        status: 'success',
        results: sales.length,
        data: { sales }
      });
    } catch (error) {
      console.error('Error al obtener las ventas:', error);
      res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
  }

  async approve(req, res) {
    try {
      const { id } = req.params;
      const approvedSale = await saleService.approveSale(id);
      
      res.json({
        status: 'success',
        message: 'Venta aprobada y stock descontado',
        data: { sale: approvedSale }
      });
    } catch (error) {
      console.error('Error al aprobar la venta:', error);
      res.status(500).json({ 
        status: 'error', 
        message: 'No se pudo aprobar la venta',
        detail: error.message
      });
    }
  }
}

module.exports = new SaleController();
