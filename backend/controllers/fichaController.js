// backend/controllers/fichaController.js
const CreacionOferta = require('../models/CreacionOferta');
const EstadoOferta = require('../models/EstadoOferta');
const Inscripcion = require('../models/Inscripcion');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');
// Al inicio del archivo, agrega:
const { generarExcelValidacionAspirantes } = require('../services/excelGenerator');


// 1. Funcionario comienza proceso de ficha
const iniciarProcesoFicha = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const funcionario = req.usuario;

    console.log('🚀 iniciarProcesoFicha - Oferta ID:', ofertaId);

    const oferta = await CreacionOferta.findById(ofertaId);
    if (!oferta) {
      return res.status(404).json({ success: false, message: 'Oferta no encontrada' });
    }

    const estadoProceso = await EstadoOferta.findOne({ codigo: 'ficha_proceso_creacion' });
    if (!estadoProceso) {
      return res.status(500).json({ 
        success: false, 
        message: 'Estado "ficha_proceso_creacion" no encontrado. Ejecuta insertarEstados.js' 
      });
    }

    oferta.estado_administrativo = estadoProceso._id;
    oferta.fecha_proceso_ficha = new Date();
    
    if (!oferta.historial_administrativo) {
      oferta.historial_administrativo = [];
    }
    oferta.historial_administrativo.push({
      estado: 'ficha_proceso_creacion',
      comentario: 'Inicio del proceso de creación de ficha por funcionario',
      cambiado_por: funcionario._id,
      fecha: new Date()
    });

    await oferta.save();
    await oferta.populate('estado_administrativo');

    res.json({
      success: true,
      message: 'Proceso de ficha iniciado correctamente',
      data: { estado_administrativo: oferta.estado_administrativo }
    });

  } catch (error) {
    console.error('❌ Error en iniciarProcesoFicha:', error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};

// 2. Generar Excel masivo de aspirantes
// backend/controllers/fichaController.js
// Reemplaza la función generarExcelMasivoAspirantes

const generarExcelMasivoAspirantes = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const oferta = await CreacionOferta.findById(ofertaId).populate('programa_formacion');
    
    if (!oferta) {
      return res.status(404).json({ success: false, message: 'Oferta no encontrada' });
    }

    const inscritos = await Inscripcion.find({ oferta_id: ofertaId })
      .populate('tipo_documento')
      .populate('caracterizacion');

    const workbook = await generarExcelValidacionAspirantes(inscritos, oferta);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=aspirantes_validar_${oferta.programa_formacion?.codigo || ofertaId}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Subir Excel masivo (CORREGIDO)
const subirExcelMasivo = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const funcionario = req.usuario;

    console.log('📤 subirExcelMasivo - Oferta ID:', ofertaId);
    console.log('📁 Archivo recibido:', req.file);
    console.log('👤 Funcionario:', funcionario?._id);

    // Verificar que se recibió el archivo
    if (!req.file) {
      console.log('❌ No se recibió archivo');
      return res.status(400).json({ success: false, message: 'Debe subir un archivo Excel' });
    }

    // Verificar que la oferta existe
    const oferta = await CreacionOferta.findById(ofertaId);
    if (!oferta) {
      console.log('❌ Oferta no encontrada');
      return res.status(404).json({ success: false, message: 'Oferta no encontrada' });
    }

    console.log('✅ Oferta encontrada:', oferta._id);

    // Guardar la ruta del Excel
    oferta.excel_aspirantes_funcionario = req.file.path;
    oferta.fecha_creacion_ficha = new Date();

    // Buscar el estado "ficha_creada"
    const estadoFichaCreada = await EstadoOferta.findOne({ codigo: 'ficha_creada' });
    if (!estadoFichaCreada) {
      console.log('❌ Estado "ficha_creada" no encontrado');
      return res.status(500).json({ 
        success: false, 
        message: 'Estado "ficha_creada" no encontrado. Ejecuta insertarEstados.js' 
      });
    }

    console.log('✅ Estado encontrado:', estadoFichaCreada.nombre);

    // Actualizar estado_administrativo
    oferta.estado_administrativo = estadoFichaCreada._id;
    
    if (!oferta.historial_administrativo) {
      oferta.historial_administrativo = [];
    }
    oferta.historial_administrativo.push({
      estado: 'ficha_creada',
      comentario: 'Ficha creada y enviada al instructor para validación de aspirantes',
      cambiado_por: funcionario._id,
      fecha: new Date()
    });

    await oferta.save();
    console.log('✅ Oferta guardada correctamente');

    res.json({
      success: true,
      message: 'Excel subido correctamente. La oferta ha sido enviada al instructor para validación.',
      data: { estado_administrativo: 'ficha_creada' }
    });

  } catch (error) {
    console.error('❌ Error en subirExcelMasivo:', error);
    res.status(500).json({ success: false, message: error.message, stack: error.stack });
  }
};


// backend/controllers/fichaController.js
// Agrega esta nueva función

// Matrícula directa (sin validación de instructor)
// backend/controllers/fichaController.js
// Asegúrate de que esta función existe

const matricularDirectamente = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const { observaciones, codigo_ficha } = req.body;
    const funcionario = req.usuario;

    console.log('🚀 Matrícula directa para oferta:', ofertaId);

    const oferta = await CreacionOferta.findById(ofertaId);
    if (!oferta) {
      return res.status(404).json({ success: false, message: 'Oferta no encontrada' });
    }

    if (codigo_ficha) {
      oferta.codigo_ficha_manual = codigo_ficha;
    }

    if (observaciones) {
      oferta.observaciones_proceso = observaciones;
    }
    
    oferta.fecha_matricula_completada = new Date();

    const estadoMatriculados = await EstadoOferta.findOne({ codigo: 'matriculados' });
    if (estadoMatriculados) {
      oferta.estado_administrativo = estadoMatriculados._id;
      
      if (!oferta.historial_administrativo) {
        oferta.historial_administrativo = [];
      }
      oferta.historial_administrativo.push({
        estado: 'matriculados',
        comentario: observaciones || 'Matrícula completada directamente por funcionario',
        cambiado_por: funcionario._id,
        fecha: new Date()
      });
    }

    await Inscripcion.updateMany(
      { oferta_id: ofertaId },
      { $set: { estado: 'aprobada' } }
    );

    await oferta.save();

    res.json({
      success: true,
      message: 'Matrícula completada exitosamente',
      data: { 
        estado_administrativo: 'matriculados',
        inscritos_actualizados: true
      }
    });

  } catch (error) {
    console.error('❌ Error en matricularDirectamente:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};



// 4. Instructor descarga Excel para validar
const descargarExcelParaValidar = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const oferta = await CreacionOferta.findById(ofertaId);
    
    if (!oferta || !oferta.excel_aspirantes_funcionario) {
      return res.status(404).json({ success: false, message: 'Excel no disponible' });
    }

    if (!fs.existsSync(oferta.excel_aspirantes_funcionario)) {
      return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
    }

    res.download(oferta.excel_aspirantes_funcionario, `validar_aspirantes_${ofertaId}.xlsx`);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Instructor sube Excel validado
const subirExcelValidado = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const instructor = req.usuario;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Debe subir un archivo Excel' });
    }

    const oferta = await CreacionOferta.findById(ofertaId);
    if (!oferta) {
      return res.status(404).json({ success: false, message: 'Oferta no encontrada' });
    }

    oferta.excel_aspirantes_validado = req.file.path;
    oferta.fecha_validacion_instructor = new Date();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(req.file.path);
    const worksheet = workbook.getWorksheet(1);
    
    const aprobados = [];
    const rechazados = [];
    
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const aprueba = worksheet.getCell(`G${i}`).value;
      const documento = worksheet.getCell(`A${i}`).value;
      const nombre = worksheet.getCell(`B${i}`).value;
      const apellidos = worksheet.getCell(`C${i}`).value;
      const observaciones = worksheet.getCell(`H${i}`).value;
      
      if (aprueba && aprueba.toString().toUpperCase() === 'SÍ') {
        aprobados.push({ documento, nombre: `${nombre} ${apellidos}`, observaciones });
      } else if (aprueba && aprueba.toString().toUpperCase() === 'NO') {
        rechazados.push({ documento, nombre: `${nombre} ${apellidos}`, observaciones });
      }
    }
    
    oferta.lista_aprobados = aprobados;
    oferta.lista_rechazados = rechazados;

    const estadoValidacion = await EstadoOferta.findOne({ codigo: 'validacion_instructor' });
    if (estadoValidacion) {
      oferta.estado_administrativo = estadoValidacion._id;
      oferta.historial_administrativo.push({
        estado: 'validacion_instructor',
        comentario: `Validación completada. Aprobados: ${aprobados.length}, Rechazados: ${rechazados.length}`,
        cambiado_por: instructor._id,
        fecha: new Date()
      });
    }

    await oferta.save();

    res.json({
      success: true,
      message: 'Excel validado subido correctamente',
      data: { aprobados: aprobados.length, rechazados: rechazados.length }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Funcionario descarga Excel validado
const descargarExcelValidado = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const oferta = await CreacionOferta.findById(ofertaId);
    
    if (!oferta || !oferta.excel_aspirantes_validado) {
      return res.status(404).json({ success: false, message: 'Excel validado no disponible' });
    }

    if (!fs.existsSync(oferta.excel_aspirantes_validado)) {
      return res.status(404).json({ success: false, message: 'Archivo no encontrado' });
    }

    res.download(oferta.excel_aspirantes_validado, `resultados_validacion_${ofertaId}.xlsx`);

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Funcionario confirma matrícula
const confirmarMatriculaCompletada = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    const { observaciones } = req.body;
    const funcionario = req.usuario;

    const oferta = await CreacionOferta.findById(ofertaId);
    if (!oferta) {
      return res.status(404).json({ success: false, message: 'Oferta no encontrada' });
    }

    if (observaciones) {
      oferta.observaciones_proceso = observaciones;
    }
    
    oferta.fecha_matricula_completada = new Date();

    const estadoMatriculados = await EstadoOferta.findOne({ codigo: 'matriculados' });
    if (estadoMatriculados) {
      oferta.estado_administrativo = estadoMatriculados._id;
      oferta.historial_administrativo.push({
        estado: 'matriculados',
        comentario: observaciones || 'Matrícula completada exitosamente',
        cambiado_por: funcionario._id,
        fecha: new Date()
      });
    }

    await oferta.save();

    res.json({
      success: true,
      message: 'Matrícula completada exitosamente',
      data: { estado_administrativo: 'matriculados' }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Obtener resumen del proceso
const getResumenProcesoFicha = async (req, res) => {
  try {
    const { ofertaId } = req.params;

    const oferta = await CreacionOferta.findById(ofertaId)
      .populate('programa_formacion')
      .populate('estado_administrativo');
    
    if (!oferta) {
      return res.status(404).json({ success: false, message: 'Oferta no encontrada' });
    }

    const inscritos = await Inscripcion.find({ oferta_id: ofertaId });

    res.json({
      success: true,
      data: {
        oferta: {
          id: oferta._id,
          programa: oferta.programa_formacion?.nombre_programa,
          estado: oferta.estado_administrativo?.nombre,
          estado_codigo: oferta.estado_administrativo?.codigo
        },
        fechas: {
          inicio_proceso: oferta.fecha_proceso_ficha,
          creacion_ficha: oferta.fecha_creacion_ficha,
          validacion_instructor: oferta.fecha_validacion_instructor,
          matricula_completada: oferta.fecha_matricula_completada
        },
        inscritos: { total: inscritos.length },
        validacion: {
          aprobados: oferta.lista_aprobados?.length || 0,
          rechazados: oferta.lista_rechazados?.length || 0
        },
        documentos: {
          tiene_excel_funcionario: !!oferta.excel_aspirantes_funcionario,
          tiene_excel_validado: !!oferta.excel_aspirantes_validado
        },
        observaciones: oferta.observaciones_proceso,
        lista_aprobados: oferta.lista_aprobados || [],
        lista_rechazados: oferta.lista_rechazados || []
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ EXPORTAR TODAS LAS FUNCIONES
module.exports = {
  iniciarProcesoFicha,
  generarExcelMasivoAspirantes,
  subirExcelMasivo,
  descargarExcelParaValidar,
  subirExcelValidado,
  descargarExcelValidado,
  confirmarMatriculaCompletada,
  getResumenProcesoFicha,
  matricularDirectamente  
};