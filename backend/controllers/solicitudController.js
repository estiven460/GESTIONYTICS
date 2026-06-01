const SolicitudValidacion = require('../models/SolicitudValidacion');
const CreacionOferta = require('../models/CreacionOferta');
const User = require('../models/User');
const Coordinador = require('../models/Coordinador');
const EstadoOferta = require('../models/EstadoOferta');
const Inscripcion = require('../models/Inscripcion');
const Instructor = require('../models/Instructor');
const { generarFichaCaracterizacion } = require('../services/pdfGenerator');
const { cambiarEstado } = require('../services/estadoService');
const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');


// =============================================
// FUNCIONES PARA INSTRUCTORES
// =============================================

// Instructor: Crear solicitud
const crearSolicitud = async (req, res) => {
  try {
    const { oferta_id, mensaje } = req.body;
    const instructor = req.usuario;

    // Verificar que la oferta existe y pertenece al instructor
    const oferta = await CreacionOferta.findOne({
      _id: oferta_id,
      creado_por: instructor._id
    });

    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada o no pertenece al instructor'
      });
    }

    // Verificar que el instructor tiene coordinador asignado
    if (!instructor.coordinadorAsignado) {
      return res.status(400).json({
        success: false,
        message: 'No tienes un coordinador asignado'
      });
    }

    // Crear solicitud
    const nuevaSolicitud = new SolicitudValidacion({
      oferta_id,
      instructor_id: instructor._id,
      coordinador_id: instructor.coordinadorAsignado,
      mensaje,
      estado: 'pendiente'
    });

    await nuevaSolicitud.save();

    res.status(201).json({
      success: true,
      message: 'Solicitud enviada al coordinador',
      data: nuevaSolicitud
    });

  } catch (error) {
    console.error('Error en crearSolicitud:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// =============================================
// FUNCIONES PARA DESCARGAR ARCHIVOS - CORREGIDAS
// =============================================

// Descargar ficha de caracterización - VERSIÓN CORREGIDA
const descargarFicha = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔍 === DESCARGA FICHA DESDE SOLICITUD ===');
    console.log('📄 ID Solicitud:', id);
    
    // 1. Buscar la solicitud y popular la oferta con TODOS los datos
    const solicitud = await SolicitudValidacion.findById(id)
      .populate({
        path: 'oferta_id',
        populate: [
          { path: 'programa_formacion' },
          { path: 'modalidad' },
          { path: 'tipo_programa' },
          { path: 'tipo_oferta' },
          { path: 'ubicacion.municipio' },
          { path: 'programa_especial' },
          { 
            path: 'creado_por',
            select: 'nombre apellido nombreUsuario numeroIdentificacion correoElectronico telefono'
          },
          { 
            path: 'empresa_solicitante',
            select: 'nombre nit direccion fecha_creacion tipo_empresa numero_empleados'
          },
          { path: 'coordinador_asignado', select: 'nombre' }
        ]
      });
    
    if (!solicitud || !solicitud.oferta_id) {
      return res.status(404).json({ 
        success: false, 
        message: 'Solicitud u oferta no encontrada' 
      });
    }
    
    const oferta = solicitud.oferta_id;
    
    console.log('📄 ID Oferta:', oferta._id);
    console.log('📄 es_campesena:', oferta.es_campesena);
    console.log('📄 creado_por (nombre):', oferta.creado_por?.nombre);
    console.log('📄 creado_por (correo):', oferta.creado_por?.correoElectronico);
    console.log('📄 creado_por (identificacion):', oferta.creado_por?.numeroIdentificacion);
    console.log('📄 instructor_nombre:', oferta.instructor_nombre);
    console.log('📄 instructor_correo:', oferta.instructor_correo);
    console.log('📄 instructor_identificacion:', oferta.instructor_identificacion);
    
    // 2. Convertir a objeto para poder agregar instructores
    let ofertaParaPDF = oferta.toObject ? oferta.toObject() : oferta;
    
    // 3. Si es Campesena, cargar instructores
    if (oferta.es_campesena) {
      const instructores = await Instructor.find({ oferta_id: oferta._id });
      ofertaParaPDF.instructores = instructores;
      console.log('📄 Instructores campesena encontrados:', instructores.length);
      
      if (instructores.length > 0) {
        const instructorTecnico = instructores.find(i => i.tipo === 'Técnico');
        if (instructorTecnico) {
          console.log('📄 Instructor Técnico:', {
            nombre: instructorTecnico.nombre,
            correo: instructorTecnico.correo,
            identificacion: instructorTecnico.identificacion
          });
        }
      }
      
      // 4. Usar datos de respaldo de la oferta si es necesario
      if ((!ofertaParaPDF.creado_por || !ofertaParaPDF.creado_por.correoElectronico) && oferta.instructor_correo) {
        ofertaParaPDF.creado_por = ofertaParaPDF.creado_por || {};
        ofertaParaPDF.creado_por.correoElectronico = oferta.instructor_correo;
        ofertaParaPDF.creado_por.numeroIdentificacion = oferta.instructor_identificacion;
        ofertaParaPDF.creado_por.nombre = oferta.instructor_nombre;
        ofertaParaPDF.creado_por.telefono = oferta.instructor_telefono;
        console.log('📄 Usando datos de respaldo de la oferta');
      }
    }
    
    // 5. Generar PDF con la función existente
    console.log('📄 Generando PDF con los datos del instructor...');
    const pdfBuffer = await generarFichaCaracterizacion(ofertaParaPDF);
    
    // 6. Enviar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ficha-${oferta._id}.pdf`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('❌ Error descargando ficha:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al generar el PDF',
      error: error.message 
    });
  }
};

// Descargar carta PDF
const descargarCarta = async (req, res) => {
  try {
    const { id } = req.params;
    
    const solicitud = await SolicitudValidacion.findById(id).populate('oferta_id');
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    const oferta = solicitud.oferta_id;
    if (!oferta.carta_pdf) {
      return res.status(404).json({ message: 'Carta no disponible' });
    }

    if (!fs.existsSync(oferta.carta_pdf)) {
      return res.status(404).json({ message: 'Archivo de carta no encontrado' });
    }

    res.download(oferta.carta_pdf, `carta-${oferta._id}.pdf`);
  } catch (error) {
    console.error('Error descargando carta:', error);
    res.status(500).json({ message: error.message });
  }
};



const descargarExcel = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📥 Solicitando Excel para solicitud:', id);
    
    const solicitud = await SolicitudValidacion.findById(id).populate('oferta_id');
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    const ofertaId = solicitud.oferta_id._id;
    
    // Obtener la oferta con su programa
    const oferta = await CreacionOferta.findById(ofertaId)
      .populate('programa_formacion');
    
    if (!oferta) {
      return res.status(404).json({ message: 'Oferta no encontrada' });
    }

    // Obtener los inscritos de esta oferta
    const inscritos = await Inscripcion.find({ oferta_id: ofertaId })
      .populate('tipo_documento')
      .populate('caracterizacion');

    // Crear Excel con el formato específico
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inscritos');

    // Definir las columnas
    worksheet.columns = [
      { header: 'Resultado del Registro (Reservado para el sistema)', key: 'resultado', width: 40 },
      { header: 'Tipo de Identificación', key: 'tipo_documento', width: 25 },
      { header: 'Numero de Identificación', key: 'numero_documento', width: 25 },
      { header: 'Código de la ficha', key: 'codigo_ficha', width: 20 },
      { header: 'Tipo Población Aspirante', key: 'tipo_poblacion', width: 25 },
      { header: 'Codigo Empresa (Solo si la ficha es cerrada)', key: 'codigo_empresa', width: 30 }
    ];

    // Estilo para el encabezado
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF00643C' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    // Agregar los datos de los inscritos - CÓDIGO DE FICHA VACÍO
    if (inscritos && inscritos.length > 0) {
      inscritos.forEach(inscrito => {
        worksheet.addRow({
          resultado: '',
          tipo_documento: inscrito.tipo_documento?.nombre || '',
          numero_documento: inscrito.numero_documento || '',
          codigo_ficha: '', // ← IMPORTANTE: VACÍO
          tipo_poblacion: inscrito.caracterizacion?.tipo_caracterizacion || '',
          codigo_empresa: ''
        });
      });
    } else {
      worksheet.addRow({
        resultado: '',
        tipo_documento: '',
        numero_documento: '',
        codigo_ficha: '', // ← VACÍO
        tipo_poblacion: '',
        codigo_empresa: ''
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inscritos_${oferta.programa_formacion?.codigo || 'formato'}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('❌ Error descargando excel:', error);
    res.status(500).json({ message: error.message });
  }
};

// Descargar PDF fusionado de cédulas
const descargarCedulas = async (req, res) => {
  try {
    const { id } = req.params;
    
    const solicitud = await SolicitudValidacion.findById(id).populate('oferta_id');
    if (!solicitud) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    const ofertaId = solicitud.oferta_id._id;
    const fusionadosDir = path.join(__dirname, '../uploads/fusionados');
    
    if (!fs.existsSync(fusionadosDir)) {
      return res.status(404).json({ message: 'No hay cédulas disponibles' });
    }
    
    const files = fs.readdirSync(fusionadosDir);
    const cedulasFile = files.find(f => f.includes(ofertaId.toString()) && f.endsWith('.pdf'));
    
    if (!cedulasFile) {
      return res.status(404).json({ message: 'PDF de cédulas no encontrado' });
    }

    const cedulasPath = path.join(fusionadosDir, cedulasFile);
    res.download(cedulasPath, `cedulas-${ofertaId}.pdf`);
  } catch (error) {
    console.error('Error descargando cédulas:', error);
    res.status(500).json({ message: error.message });
  }
};


// =============================================
// FUNCIONES PARA COORDINADORES
// =============================================

// Coordinador: Obtener solicitudes pendientes
const getSolicitudesPendientes = async (req, res) => {
  try {
    const coordinador = req.usuario;

    const solicitudes = await SolicitudValidacion.find({
      coordinador_id: coordinador._id,
      estado: 'pendiente'
    })
      .populate({
        path: 'oferta_id',
        populate: {
          path: 'programa_formacion',
          select: 'nombre_programa codigo'
        }
      })
      .populate('instructor_id', 'nombre apellido correoElectronico')
      .sort({ fecha_solicitud: -1 });

    res.json({
      success: true,
      count: solicitudes.length,
      data: solicitudes
    });

  } catch (error) {
    console.error('Error en getSolicitudesPendientes:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Coordinador: Obtener solicitud por ID
const getSolicitudById = async (req, res) => {
  try {
    const { id } = req.params;
    const coordinador = req.usuario;

    const solicitud = await SolicitudValidacion.findOne({
      _id: id,
      coordinador_id: coordinador._id
    })
      .populate({
        path: 'oferta_id',
        populate: [
          { path: 'programa_formacion', select: 'nombre_programa codigo' },
          { path: 'creado_por', select: 'nombre apellido correoElectronico numeroIdentificacion' }
        ]
      })
      .populate('instructor_id', 'nombre apellido correoElectronico');

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    res.json({
      success: true,
      data: solicitud
    });

  } catch (error) {
    console.error('Error en getSolicitudById:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Coordinador: Aprobar solicitud
const aprobarSolicitud = async (req, res) => {
  try {
    console.log('🔍 ===== INICIO APROBAR SOLICITUD =====');
    
    const { id } = req.params;
    const { comentarios } = req.body;
    const coordinador = req.usuario;

    if (!coordinador) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const solicitud = await SolicitudValidacion.findOne({
      _id: id,
      coordinador_id: coordinador._id,
      estado: 'pendiente'
    }).populate('oferta_id');

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    const oferta = await CreacionOferta.findById(solicitud.oferta_id._id);
    
    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Oferta no encontrada'
      });
    }

    const estadoAprobada = await EstadoOferta.findOne({ codigo: 'aprobada' });
    
    if (!estadoAprobada) {
      throw new Error('El estado "aprobada" no existe en la base de datos');
    }

    oferta.estado = estadoAprobada._id;
    
    if (!oferta.historial_estados) {
      oferta.historial_estados = [];
    }
    
    oferta.historial_estados.push({
      estado: estadoAprobada._id,
      comentario: comentarios || 'Aprobada por coordinador',
      cambiado_por: coordinador._id,
      cambiado_por_modelo: 'Coordinador',
      fecha: new Date()
    });

    const estadoListaEspera = await EstadoOferta.findOne({ codigo: 'lista_espera' });
    if (estadoListaEspera) {
      oferta.estado_administrativo = estadoListaEspera._id;
      console.log('✅ Estado administrativo asignado: lista_espera');
      
      if (!oferta.historial_administrativo) {
        oferta.historial_administrativo = [];
      }
      oferta.historial_administrativo.push({
        estado: 'lista_espera',
        comentario: 'Oferta aprobada, en espera de revisión por funcionario',
        cambiado_por: coordinador._id,
        fecha: new Date()
      });
    }

    await oferta.save();
    console.log('✅ Estado de oferta actualizado a aprobada');

    solicitud.estado = 'aprobada';
    solicitud.comentarios = comentarios;
    solicitud.fecha_respuesta = new Date();
    await solicitud.save();

    res.json({
      success: true,
      message: 'Solicitud aprobada exitosamente',
      data: solicitud
    });

  } catch (error) {
    console.error('❌ ERROR EN aprobarSolicitud:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Coordinador: Rechazar solicitud
const rechazarSolicitud = async (req, res) => {
  try {
    console.log('🔍 ===== INICIO RECHAZAR SOLICITUD =====');
    
    const { id } = req.params;
    const { comentarios } = req.body;
    const coordinador = req.usuario;

    if (!coordinador) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const solicitud = await SolicitudValidacion.findOne({
      _id: id,
      coordinador_id: coordinador._id,
      estado: 'pendiente'
    });

    if (!solicitud) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada o ya fue procesada'
      });
    }

    const oferta = await CreacionOferta.findById(solicitud.oferta_id);
    
    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'La oferta asociada no existe'
      });
    }

    const estadoRechazada = await EstadoOferta.findOne({ codigo: 'rechazada' });
    
    if (!estadoRechazada) {
      throw new Error('El estado "rechazada" no existe en la base de datos');
    }

    oferta.estado = estadoRechazada._id;
    
    // ✅ GUARDAR COMENTARIO DE RECHAZO EN LA OFERTA
    oferta.comentario_rechazo = comentarios;
    
    if (!oferta.historial_estados) {
      oferta.historial_estados = [];
    }
    
    oferta.historial_estados.push({
      estado: estadoRechazada._id,
      comentario: comentarios,
      cambiado_por: coordinador._id,
      cambiado_por_modelo: 'Coordinador',
      fecha: new Date()
    });

    await oferta.save();
    console.log('✅ Estado de oferta actualizado a rechazada');
    console.log('✅ Comentario de rechazo guardado en la oferta:', comentarios);

    solicitud.estado = 'rechazada';
    solicitud.comentarios = comentarios;
    solicitud.fecha_respuesta = new Date();
    await solicitud.save();
    console.log('✅ Solicitud actualizada correctamente');

    res.json({
      success: true,
      message: 'Solicitud rechazada exitosamente',
      data: {
        solicitud,
        oferta: {
          id: oferta._id,
          estado: oferta.estado,
          comentario_rechazo: oferta.comentario_rechazo
        }
      }
    });

  } catch (error) {
    console.error('❌ ERROR EN rechazarSolicitud:', error);
    res.status(500).json({
      success: false,
      message: error.message,
      error: error.toString()
    });
  }
};

// Coordinador: Verificar archivos de una solicitud
const verificarArchivosSolicitud = async (req, res) => {
  try {
    const { id } = req.params;

    const solicitud = await SolicitudValidacion.findById(id).populate('oferta_id');
    
    if (!solicitud) {
      console.error(`❌ Solicitud no encontrada: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    if (!solicitud.oferta_id) {
      console.error(`❌ Oferta no encontrada para la solicitud: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'La oferta asociada a esta solicitud no existe o fue eliminada'
      });
    }

    const oferta = solicitud.oferta_id;
    const archivos = {
      ficha: false,
      carta: false,
      excel: false,
      cedulas: false
    };

    // Verificar Ficha de Caracterización
    const fichasDir = path.join(__dirname, '../uploads/fichas');
    if (fs.existsSync(fichasDir)) {
      const files = fs.readdirSync(fichasDir);
      const fichaFile = files.find(f => f.includes(oferta._id.toString()) && f.endsWith('.pdf'));
      archivos.ficha = !!fichaFile;
    }

    // Verificar Carta PDF
    if (oferta.carta_pdf && fs.existsSync(oferta.carta_pdf)) {
      archivos.carta = true;
    }

    // Verificar Excel de inscritos
    try {
      const totalInscritos = await Inscripcion.countDocuments({ oferta_id: oferta._id });
      archivos.excel = totalInscritos > 0;
    } catch (err) {
      console.error('Error al contar inscritos:', err);
      archivos.excel = false;
    }

    // Verificar PDF fusionado de cédulas
    const fusionadosDir = path.join(__dirname, '../uploads/fusionados');
    if (fs.existsSync(fusionadosDir)) {
      const files = fs.readdirSync(fusionadosDir);
      const cedulasFile = files.find(f => f.includes(oferta._id.toString()) && f.endsWith('.pdf'));
      archivos.cedulas = !!cedulasFile;
    }

    console.log(`✅ Archivos verificados para solicitud ${id}:`, archivos);

    res.json({
      success: true,
      data: archivos
    });

  } catch (error) {
    console.error('❌ Error en verificarArchivosSolicitud:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// =============================================
// EXPORTACIONES
// =============================================
module.exports = {
  // Instructor
  crearSolicitud,
  
  // Coordinador
  getSolicitudesPendientes,
  getSolicitudById,
  rechazarSolicitud,
  aprobarSolicitud,
  verificarArchivosSolicitud,
  
  // Descargas
  descargarFicha,
  descargarCarta,
  descargarExcel,
  descargarCedulas
};