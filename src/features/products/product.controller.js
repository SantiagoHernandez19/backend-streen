const productService = require('./product.service');

class ProductController {
  async getAll(req, res) {
    try {
      const products = await productService.getAllProducts();
      
      res.status(200).json({
        status: 'success',
        results: products.length,
        data: { products }
      });
    } catch (error) {
      console.error("Error al obtener productos:", error);
      res.status(500).json({
        status: 'error',
        message: 'Hubo un error interno al obtener los productos'
      });
    }
  }
}

module.exports = new ProductController();
