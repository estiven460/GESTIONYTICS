const User = require('../models/User');
const Coordinador = require('../models/Coordinador');
const Funcionario = require('../models/Funcionario');

// Obtener instructores asignados a un coordinador
const getInstructoresPorCoordinador = async (req, res) => {
  try {
    const { coordinadorId } = req.params;
    
    const instructores = await User.find({ 
      coordinadorAsignado: coordinadorId 
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: instructores.length,
      data: instructores
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===== NUEVA FUNCIÓN: Obtener usuario por ID (para instructores, coordinadores, funcionarios) =====
const getUsuarioById = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 Buscando usuario con ID:', id);
    
    // Buscar en Users (instructores)
    let usuario = await User.findById(id).select('-password');
    
    // Si no está en Users, buscar en Coordinadores
    if (!usuario) {
      usuario = await Coordinador.findById(id).select('-password');
    }
    
    // Si no está en Coordinadores, buscar en Funcionarios
    if (!usuario) {
      usuario = await Funcionario.findById(id).select('-password');
    }
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    console.log('✅ Usuario encontrado:', usuario.nombre, usuario.correoElectronico);
    
    res.json({
      success: true,
      data: usuario
    });
    
  } catch (error) {
    console.error('Error en getUsuarioById:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getInstructoresPorCoordinador,
  getUsuarioById  // ← EXPORTAR LA NUEVA FUNCIÓN
};