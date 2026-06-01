const Inscripcion = require('../models/Inscripcion');
const CreacionOferta = require('../models/CreacionOferta');
const { generarExcelInscripcion, generarExcelCedulas } = require('../services/excelGenerator');
const fs = require('fs');
const path = require('path');
const { fusionarPDFs } = require('../services/pdfMerger');
const ExcelJS = require('exceljs');

// Variable para llevar control de los PDFs pendientes
const colaFusion = new Map(); // clave: oferta_id, valor: array de archivos

// Función para crear inscripción
const crearInscripcion = async (req, res) => {
  try {
    const { codigo } = req.params;
    
    // Buscar la oferta
    const oferta = await CreacionOferta.findOne({ link_inscripciones: `/inscribirse/${codigo}` })
      .populate('programa_formacion')
      .populate('tipo_oferta')
      .populate('empresa_solicitante');
    
    if (!oferta) {
      return res.status(404).json({
        success: false,
        message: 'Link de inscripción no válido'
      });
    }

    // Verificar cupos
    if (oferta.cupos_disponibles <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay cupos disponibles para esta oferta'
      });
    }

    // Procesar archivo PDF individual
    let pdfPath = null;
    if (req.file) {
      pdfPath = req.file.path;
    }

    // Crear la inscripción
    const nuevaInscripcion = new Inscripcion({
      oferta_id: oferta._id,
      nombres: req.body.nombres,
      apellidos: req.body.apellidos,
      tipo_documento: req.body.tipo_documento,
      numero_documento: req.body.numero_documento,
      caracterizacion: req.body.caracterizacion,
      telefono: req.body.telefono,
      correo: req.body.correo,
      pdf_cedula: pdfPath
    });

    await nuevaInscripcion.save();

    // ===== ACUMULAR PDF PARA FUSIÓN =====
    if (pdfPath) {
      const ofertaIdStr = oferta._id.toString();
      
      // Inicializar cola si no existe
      if (!colaFusion.has(ofertaIdStr)) {
        colaFusion.set(ofertaIdStr, []);
      }
      
      // Agregar PDF a la cola
      colaFusion.get(ofertaIdStr).push({
        path: pdfPath,
        inscripcionId: nuevaInscripcion._id,
        documento: nuevaInscripcion.numero_documento
      });
      
      console.log(`📥 PDF agregado a cola. Total para esta oferta: ${colaFusion.get(ofertaIdStr).length}`);
      
      // Verificar si ya tenemos suficientes PDFs para fusionar
      const totalInscritos = await Inscripcion.countDocuments({ oferta_id: oferta._id });
      const totalCupos = oferta.cupo_maximo;
      const inscritosRestantes = totalCupos - totalInscritos;
      
      // Fusionar si:
      // 1. Llegamos a 10 PDFs acumulados, o
      // 2. Ya no quedan cupos (último inscrito)
      if (colaFusion.get(ofertaIdStr).length >= 10 || inscritosRestantes === 0) {
        console.log(`🔄 Fusionando ${colaFusion.get(ofertaIdStr).length} PDFs para oferta ${ofertaIdStr}`);
        
        // Fusionar en segundo plano (NO eliminar los PDFs individuales)
        setTimeout(async () => {
          try {
            const pdfsAFusionar = colaFusion.get(ofertaIdStr);
            const timestamp = Date.now();
            const nombreArchivo = `cedulas_fusionadas_${ofertaIdStr}_${timestamp}.pdf`;
            const resultado = await fusionarPDFs(pdfsAFusionar, ofertaIdStr, nombreArchivo);
            
            console.log(`✅ PDFs fusionados exitosamente: ${resultado.path}`);
            
            // 🔥 NO ELIMINAMOS los PDFs individuales para poder fusionar nuevamente después
            
            // Limpiar la cola
            colaFusion.delete(ofertaIdStr);
            
          } catch (fusionError) {
            console.error('❌ Error en fusión de PDFs:', fusionError);
          }
        }, 100);
      }
    }

    // Disminuir cupos
    oferta.cupos_disponibles -= 1;
    await oferta.save();

    res.status(201).json({
      success: true,
      message: 'Inscripción creada exitosamente',
      data: nuevaInscripcion
    });

  } catch (error) {
    console.error('Error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una inscripción con este número de documento'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear la inscripción',
      error: error.message
    });
  }
};

// ===== FUNCIÓN: Obtener inscritos por oferta =====
const getInscritosPorOferta = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    
    const inscritos = await Inscripcion.find({ oferta_id: ofertaId })
      .populate('tipo_documento')
      .populate('caracterizacion');
    
    res.json({
      success: true,
      data: inscritos
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Descargar Excel de inscritos
const descargarExcelInscritos = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    
    const oferta = await CreacionOferta.findById(ofertaId)
      .populate('programa_formacion');
    
    if (!oferta) {
      return res.status(404).json({ message: 'Oferta no encontrada' });
    }

    const inscritos = await Inscripcion.find({ oferta_id: ofertaId })
      .populate('tipo_documento')
      .populate('caracterizacion');

    await generarExcelInscritos(inscritos, oferta, res);

  } catch (error) {
    console.error('Error descargando Excel:', error);
    res.status(500).json({ message: error.message });
  }
};

// Función para fusionar manualmente (ahora con descarga directa)
const fusionarPDFsManual = async (req, res) => {
  try {
    console.log('🔍 ===== FUSIONAR PDFS MANUAL =====');
    const { ofertaId } = req.params;
    const download = req.query.download === 'true';

    if (!ofertaId) {
      return res.status(400).json({ success: false, message: 'Se requiere el ID de la oferta' });
    }

    const inscripciones = await Inscripcion.find({ oferta_id: ofertaId });
    
    console.log(`📊 Total inscripciones: ${inscripciones.length}`);
    
    // 🔥 Limpiar referencias inválidas y recolectar PDFs válidos
    const pdfs = [];
    let limpiados = 0;
    
    for (const ins of inscripciones) {
      if (ins.pdf_cedula) {
        if (fs.existsSync(ins.pdf_cedula)) {
          // PDF existe, agregar a la lista
          pdfs.push({
            path: ins.pdf_cedula,
            inscripcionId: ins._id,
            documento: ins.numero_documento,
            nombre: `${ins.nombres} ${ins.apellidos}`
          });
          console.log(`✅ PDF válido para: ${ins.nombres} ${ins.apellidos}`);
        } else {
          // PDF no existe, limpiar referencia
          console.log(`⚠️ PDF no encontrado, limpiando referencia para: ${ins.nombres} ${ins.apellidos}`);
          await Inscripcion.updateOne(
            { _id: ins._id },
            { $set: { pdf_cedula: null } }
          );
          limpiados++;
        }
      }
    }
    
    console.log(`📊 Resumen:`);
    console.log(`   - PDFs válidos: ${pdfs.length}`);
    console.log(`   - Referencias limpiadas: ${limpiados}`);

    if (pdfs.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No hay PDFs de cédulas para fusionar. Los aspirantes deben subir sus cédulas.' 
      });
    }

    // Crear nombre con timestamp
    const timestamp = Date.now();
    const nombreArchivo = `cedulas_fusionadas_${ofertaId}_${timestamp}.pdf`;
    
    const resultado = await fusionarPDFs(pdfs, ofertaId, nombreArchivo);

    if (download && resultado.success && resultado.path && fs.existsSync(resultado.path)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${resultado.nombre}"`);
      return res.sendFile(resultado.path);
    }

    res.json({
      success: true,
      message: `PDF fusionado con ${resultado.totalPaginas} páginas. ${resultado.fallidos?.length || 0} archivos omitidos. Referencias limpiadas: ${limpiados}`,
      data: resultado
    });

  } catch (error) {
    console.error('❌ Error en fusionarPDFsManual:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// Obtener inscripciones por oferta
const getInscripcionesPorOferta = async (req, res) => {
  try {
    const { ofertaId } = req.params; 
    
    const inscripciones = await Inscripcion.find({ oferta_id: ofertaId })
      .populate('tipo_documento', 'nombre')
      .populate('caracterizacion', 'tipo_caracterizacion')
      .sort({ fecha_inscripcion: -1 });

    res.json({
      success: true,
      count: inscripciones.length,
      data: inscripciones
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener inscripciones',
      error: error.message
    });
  }
};

// Obtener inscripción por link único
const getInscripcionPorLink = async (req, res) => {
  try {
    const { link } = req.params;
    
    const inscripcion = await Inscripcion.findOne({ link_inscripcion: `/inscripcion/${link}` })
      .populate('tipo_documento', 'nombre')
      .populate('caracterizacion', 'tipo_caracterizacion')
      .populate('oferta_id');

    if (!inscripcion) {
      return res.status(404).json({
        success: false,
        message: 'Inscripción no encontrada'
      });
    }

    res.json({
      success: true,
      data: inscripcion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener la inscripción',
      error: error.message
    });
  }
};

// Actualizar estado de inscripción
const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const inscripcion = await Inscripcion.findByIdAndUpdate(
      id,
      { estado },
      { new: true, runValidators: true }
    );

    if (!inscripcion) {
      return res.status(404).json({
        success: false,
        message: 'Inscripción no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Estado actualizado correctamente',
      data: inscripcion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado',
      error: error.message
    });
  }
};

// Exportar Excel completo
const exportarExcelCompleto = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    
    console.log('📥 Exportando Excel completo para oferta:', ofertaId);
    
    const inscritos = await Inscripcion.find({ oferta_id: ofertaId })
      .populate('tipo_documento')
      .populate('caracterizacion');

    console.log(`📊 Inscritos encontrados: ${inscritos.length}`);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Inscritos');

    worksheet.columns = [
      { header: 'Tipo Documento', key: 'tipo_documento', width: 20 },
      { header: 'Número de Documento', key: 'numero_documento', width: 20 },
      { header: 'Nombres', key: 'nombres', width: 25 },
      { header: 'Apellidos', key: 'apellidos', width: 25 },
      { header: 'Teléfono', key: 'telefono', width: 15 },
      { header: 'Email', key: 'correo', width: 30 },
      { header: 'Caracterización', key: 'caracterizacion', width: 25 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF00643C' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    inscritos.forEach(ins => {
      worksheet.addRow({
        tipo_documento: ins.tipo_documento?.nombre || '',
        numero_documento: ins.numero_documento || '',
        nombres: ins.nombres || '',
        apellidos: ins.apellidos || '',
        telefono: ins.telefono || '',
        correo: ins.correo || '',
        caracterizacion: ins.caracterizacion?.tipo_caracterizacion || ''
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=inscritos_${ofertaId}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('❌ Error exportando Excel:', error);
    res.status(500).json({ message: error.message });
  }
};

// Exportar Excel de cédulas
const exportarExcelCedulas = async (req, res) => {
  try {
    const { ofertaId } = req.params;
    
    const oferta = await CreacionOferta.findById(ofertaId)
      .populate('programa_formacion');
    
    if (!oferta) {
      return res.status(404).json({ message: 'Oferta no encontrada' });
    }

    const inscritos = await Inscripcion.find({ oferta_id: ofertaId })
      .populate('tipo_documento')
      .populate('caracterizacion');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Cédulas');

    worksheet.columns = [
      { header: 'Resultado del Registro (Reservado para el sistema)', key: 'resultado', width: 40 },
      { header: 'Tipo de Identificación', key: 'tipo_documento', width: 25 },
      { header: 'Numero de Identificación', key: 'numero_documento', width: 25 },
      { header: 'Código de la ficha', key: 'codigo_ficha', width: 20 },
      { header: 'Tipo Población Aspirante', key: 'tipo_poblacion', width: 25 },
      { header: 'Codigo Empresa (Solo si la ficha es cerrada)', key: 'codigo_empresa', width: 30 }
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF00643C' }
    };
    worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

    if (inscritos && inscritos.length > 0) {
      inscritos.forEach(inscrito => {
        worksheet.addRow({
          resultado: '',
          tipo_documento: inscrito.tipo_documento?.nombre || '',
          numero_documento: inscrito.numero_documento || '',
          codigo_ficha: oferta?.programa_formacion?.codigo || '',
          tipo_poblacion: inscrito.caracterizacion?.tipo_caracterizacion || '',
          codigo_empresa: ''
        });
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=cedulas_${oferta.programa_formacion?.codigo || 'formato'}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Error exportando Excel de cédulas:', error);
    res.status(500).json({ message: error.message });
  }
};

// ===== EXPORTACIONES =====
module.exports = {
  inscribir: crearInscripcion,
  getInscritosPorOferta,
  exportarExcelCompleto,
  exportarExcelCedulas,
  fusionarPDFs: fusionarPDFsManual,
  getInscripcionesPorOferta,
  getInscripcionPorLink,
  actualizarEstado
};