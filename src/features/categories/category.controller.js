const categoryService = require('./category.service');

class CategoryController {
  async getAll(req, res) {
    try {
      // El controlador le pide los datos al servicio
      const categories = await categoryService.getAllCategories();
      
      // Responde con status 200 y manda las categorías en JSON
      res.status(200).json({
        status: 'success',
        results: categories.length,
        data: { categories }
      });
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      res.status(500).json({
        status: 'error',
        message: 'Hubo un error interno al obtener las categorías'
      });
    }
  }
}

module.exports = new CategoryController();
