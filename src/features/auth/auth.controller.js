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
      const isInvalid = error.message === 'Credenciales inválidas';
      res.status(isInvalid ? 401 : 500).json({ 
        status: 'error', 
        message: isInvalid ? 'Correo o contraseña incorrectos' : 'Error interno: ' + error.message
      });
    }
  }

  async register(req, res) {
    try {
      const user = await authService.register(req.body);
      res.json({
        status: 'success',
        message: 'Usuario registrado correctamente',
        data: user
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(400).json({ status: 'error', message: error.message });
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

  async getAllRoles(req, res) {
    try {
      const roles = await authService.getAllRoles();
      res.json({
        status: 'success',
        data: { roles }
      });
    } catch (error) {
      console.error('Error trayendo roles:', error);
      res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
    }
  }

  async initDB(req, res) {
    try {
      const result = await authService.initDB();
      res.json({ status: 'success', ...result });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  async fixDB(req, res) {
    try {
      const result = await authService.fixDB();
      res.json({ status: 'success', ...result });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
}

module.exports = new AuthController();
