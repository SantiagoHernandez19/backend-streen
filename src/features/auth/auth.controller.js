const authService = require('./auth.service');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const data = await authService.login(email, password);
      
      res.json({
        status: 'success',
        message: 'Sesión iniciada correctamente',
        data
      });
    } catch (error) {
      console.error('Error en Login:', error);
      res.status(401).json({ 
        status: 'error', 
        message: 'Correo o contraseña incorrectos'
      });
    }
  }

  async getAll(req, res) {
    try {
      const users = await authService.getAllUsers();
      res.json({
        status: 'success',
        data: { users }
      });
    } catch (error) {
      console.error('Error trayendo usuarios:', error);
      res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
  }
}

module.exports = new AuthController();
