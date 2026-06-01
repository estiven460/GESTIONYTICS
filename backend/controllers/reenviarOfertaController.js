const CreacionOferta = require('../models/CreacionOferta');
const SolicitudValidacion = require('../models/SolicitudValidacion');
const EstadoOferta = require('../models/EstadoOferta');

const reenviarOferta = async (req, res) => {
  try {
    const { id } = req.params;
    const { mensaje } = req.body;
    const instructor = req.usuario;

    // Buscar la oferta
    const oferta = await CreacionOferta.findById(id);
    
    if (!oferta) {
      return res.status(404).json({ 
        success: false, 
        message: 'Oferta no encontrada' 
      });
    }

    // Verificar que la oferta pertenezca al instructor
    if (oferta.creado_por.toString() !== instructor._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permiso para modificar esta oferta' 
      });
    }

    // Verificar que la oferta esté en estado rechazada
    const estadoRechazada = await EstadoOferta.findOne({ codigo: 'rechazada' });
    if (oferta.estado.toString() !== estadoRechazada?._id.toString()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Solo puedes reenviar ofertas que estén en estado rechazada' 
      });
    }

    // Buscar el estado "pendiente"
    const estadoPendiente = await EstadoOferta.findOne({ codigo: 'pendiente' });
    if (!estadoPendiente) {
      return res.status(500).json({ 
        success: false, 
        message: 'Estado "pendiente" no encontrado en la base de datos' 
      });
    }

    // Actualizar el estado de la oferta a pendiente
    oferta.estado = estadoPendiente._id;
    
    // Limpiar el comentario de rechazo (opcional)
    oferta.comentario_rechazo = null;
    
    await oferta.save();

    // Buscar o crear solicitud de validación
    let solicitud = await SolicitudValidacion.findOne({ oferta_id: id });
    
    if (solicitud) {
      // Actualizar la solicitud existente
      solicitud.estado = 'pendiente';
      solicitud.comentarios = mensaje || 'Oferta reenviada después de correcciones';
      solicitud.fecha_solicitud = new Date();
      solicitud.fecha_respuesta = null;
      await solicitud.save();
    } else {
      // Crear una nueva solicitud
      solicitud = new SolicitudValidacion({
        oferta_id: id,
        instructor_id: instructor._id,
        coordinador_id: instructor.coordinadorAsignado,
        estado: 'pendiente',
        mensaje: mensaje || 'He corregido los aspectos señalados, solicito amablemente revisar nuevamente la oferta.',
        fecha_solicitud: new Date()
      });
      await solicitud.save();
    }

    console.log(`✅ Oferta ${id} reenviada por instructor ${instructor._id}`);

    res.status(200).json({
      success: true,
      message: 'Oferta reenviada exitosamente al coordinador',
      data: {
        oferta: {
          id: oferta._id,
          estado: 'pendiente'
        },
        solicitud: {
          id: solicitud._id,
          estado: 'pendiente'
        }
      }
    });

  } catch (error) {
    console.error('Error al reenviar oferta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al reenviar la oferta',
      error: error.message
    });
  }
};

module.exports = { reenviarOferta };