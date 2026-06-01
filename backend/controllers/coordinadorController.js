const Coordinador = require('../models/Coordinador');

const getCoordinadores = async (req, res) => {
  try {
    const coordinadores = await Coordinador.find();
    res.json({
      success: true,
      data: coordinadores
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ===== NUEVA FUNCIÓN: Obtener coordinador por ID =====
const getCoordinadorById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const coordinador = await Coordinador.findById(id).select('-password');
    
    if (!coordinador) {
      return res.status(404).json({
        success: false,
        message: 'Coordinador no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: coordinador
    });
  } catch (error) {
    console.error('Error en getCoordinadorById:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getCoordinadores,
  getCoordinadorById  // ← EXPORTAR LA NUEVA FUNCIÓN
};