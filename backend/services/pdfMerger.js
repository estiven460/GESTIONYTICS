const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const fusionarPDFs = async (archivosPDF, ofertaId, nombrePersonalizado = null) => {
  try {
    console.log('🔍 ===== INICIANDO FUSIÓN DE PDFs =====');
    console.log(`📊 Total de archivos a fusionar: ${archivosPDF.length}`);
    
    // Crear un nuevo documento PDF
    const pdfFusionado = await PDFDocument.create();
    let pdfsProcesados = 0;
    let pdfsFallidos = [];
    const rutasAlternativas = [
      path.join(__dirname, '../uploads/documentos'),
      path.join(__dirname, '../uploads/fichas'),
      path.join(__dirname, '../uploads')
    ];
    
    // Recorrer cada archivo PDF
    for (let i = 0; i < archivosPDF.length; i++) {
      const archivo = archivosPDF[i];
      let rutaArchivo = archivo.path || archivo;
      let archivoEncontrado = false;
      
      try {
        console.log(`📄 Procesando archivo ${i + 1}: ${rutaArchivo}`);
        
        // Verificar que el archivo existe en la ruta original
        if (!fs.existsSync(rutaArchivo)) {
          console.log(`⚠️ Archivo no encontrado en ruta original: ${rutaArchivo}`);
          
          // Buscar en rutas alternativas
          const nombreArchivo = path.basename(rutaArchivo);
          for (const rutaAlt of rutasAlternativas) {
            const rutaPrueba = path.join(rutaAlt, nombreArchivo);
            if (fs.existsSync(rutaPrueba)) {
              console.log(`✅ Encontrado en ruta alternativa: ${rutaPrueba}`);
              rutaArchivo = rutaPrueba;
              archivoEncontrado = true;
              break;
            }
          }
          
          if (!archivoEncontrado) {
            console.log(`❌ Archivo no encontrado en ninguna ruta: ${nombreArchivo}`);
            pdfsFallidos.push({ 
              path: archivo.path, 
              error: 'Archivo no encontrado en ninguna ubicación',
              documento: archivo.documento 
            });
            continue;
          }
        }
        
        // Leer el archivo PDF
        const pdfBytes = fs.readFileSync(rutaArchivo);
        
        // Verificar que el archivo tiene contenido
        if (pdfBytes.length < 100) {
          console.log(`❌ Archivo demasiado pequeño: ${pdfBytes.length} bytes`);
          pdfsFallidos.push({ 
            path: rutaArchivo, 
            error: 'Archivo demasiado pequeño',
            documento: archivo.documento 
          });
          continue;
        }
        
        // Verificar que empieza con %PDF (cabecera de PDF)
        const header = pdfBytes.slice(0, 4).toString();
        if (header !== '%PDF') {
          console.log(`❌ Archivo no es un PDF válido (header: ${header})`);
          pdfsFallidos.push({ 
            path: rutaArchivo, 
            error: 'No es un PDF válido',
            documento: archivo.documento 
          });
          continue;
        }
        
        // Cargar el PDF
        const pdf = await PDFDocument.load(pdfBytes, { 
          ignoreEncryption: true
        });
        
        // Copiar todas las páginas
        const paginas = await pdfFusionado.copyPages(pdf, pdf.getPageIndices());
        
        // Agregar cada página al documento fusionado
        paginas.forEach((pagina) => {
          pdfFusionado.addPage(pagina);
        });
        
        pdfsProcesados++;
        console.log(`✅ PDF procesado correctamente. Páginas: ${paginas.length}`);
        
      } catch (pdfError) {
        console.error(`❌ Error procesando PDF ${rutaArchivo}:`, pdfError.message);
        pdfsFallidos.push({ 
          path: rutaArchivo, 
          error: pdfError.message,
          documento: archivo.documento 
        });
      }
    }
    
    console.log('📊 Resumen de fusión:');
    console.log(`   - Procesados: ${pdfsProcesados}`);
    console.log(`   - Fallidos: ${pdfsFallidos.length}`);
    
    if (pdfsProcesados === 0) {
      throw new Error(`No se pudo procesar ningún PDF válido. Fallidos: ${pdfsFallidos.length}`);
    }
    
    // Guardar el PDF fusionado
    const pdfBytes = await pdfFusionado.save();
    
    // Crear nombre de archivo con timestamp para evitar caché
    const timestamp = Date.now();
    const fecha = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const nombreArchivo = nombrePersonalizado || `cedulas_fusionadas_${ofertaId}_${timestamp}.pdf`;
    const rutaSalida = path.join(__dirname, '../uploads/fusionados', nombreArchivo);
    
    // Asegurar que la carpeta existe
    const dirSalida = path.dirname(rutaSalida);
    if (!fs.existsSync(dirSalida)) {
      fs.mkdirSync(dirSalida, { recursive: true });
    }
    
    // Escribir el archivo
    fs.writeFileSync(rutaSalida, pdfBytes);
    
    console.log(`✅ PDF fusionado guardado en: ${rutaSalida}`);
    console.log(`📄 Tamaño del archivo: ${(pdfBytes.length / 1024).toFixed(2)} KB`);
    
    return {
      success: true,
      path: rutaSalida,
      nombre: nombreArchivo,
      totalPaginas: pdfsProcesados,
      fallidos: pdfsFallidos
    };
    
  } catch (error) {
    console.error('❌ Error fusionando PDFs:', error);
    throw error;
  }
};

module.exports = { fusionarPDFs };