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

  async updateUser(req, res) {
    try {
      const user = await authService.updateUser(req.params.id, req.body);
      res.json({ status: 'success', data: { user } });
    } catch (error) {
      console.error('Error actualizando usuario:', error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const user = await authService.updateProfile(req.params.id, req.body);
      res.json({
        status: 'success',
        message: 'Perfil actualizado correctamente',
        data: { user }
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  async deleteUser(req, res) {
    try {
      await authService.deleteUser(req.params.id);
      res.json({ status: 'success', message: 'Usuario eliminado' });
    } catch (error) {
      console.error('Error eliminando usuario:', error);
      res.status(500).json({ status: 'error', message: error.message });
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

  async createRole(req, res) {
    try {
      const role = await authService.createRole(req.body);
      res.status(201).json({ status: 'success', data: { role } });
    } catch (error) {
      console.error('Error creando rol:', error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  async updateRole(req, res) {
    try {
      const role = await authService.updateRole(req.params.id, req.body);
      res.json({ status: 'success', data: { role } });
    } catch (error) {
      console.error('Error actualizando rol:', error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  async deleteRole(req, res) {
    try {
      await authService.deleteRole(req.params.id);
      res.json({ status: 'success', message: 'Rol eliminado' });
    } catch (error) {
      console.error('Error eliminando rol:', error);
      res.status(500).json({ status: 'error', message: error.message });
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
