const Instructor = require('../models/Instructor');

// Obtener instructores por oferta
const getInstructoresPorOferta = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    
    const instructores = await Instructor.find({ oferta_id: ofertaId });
    
    res.json({
      success: true,
      data: instructores
    });
  } catch (error) {
    console.error('Error obteniendo instructores:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getInstructoresPorOferta
};