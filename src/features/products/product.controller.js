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

  async create(req, res) {
    try {
      const { nombre, precio, id_categoria } = req.body;
      
      // Validaciones básicas antes de tocar la Base de Datos
      if (!nombre || !precio || !id_categoria) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Nombre, precio y categoría son campos obligatorios para guardar una gorra' 
        });
      }
      
      const newProduct = await productService.createProduct(req.body);
      
      res.status(201).json({
        status: 'success',
        data: { product: newProduct }
      });
    } catch (error) {
      console.error("Error al crear producto:", error);
      res.status(500).json({
        status: 'error',
        message: 'Hubo un error al crear el producto en la base de datos'
      });
    }
  }
}

module.exports = new ProductController();
