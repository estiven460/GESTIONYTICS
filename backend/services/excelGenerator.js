const ExcelJS = require('exceljs');

// Generar Excel solo con cédulas (datos personales)
const generarExcelCedulas = async (inscritos) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Cédulas');
  
  // Encabezados
  worksheet.getCell('A1').value = 'Tipo Documento';
  worksheet.getCell('B1').value = 'Número de Documento';
  worksheet.getCell('C1').value = 'Nombres';
  worksheet.getCell('D1').value = 'Apellidos';
  worksheet.getCell('E1').value = 'Teléfono';
  worksheet.getCell('F1').value = 'Email';
  worksheet.getCell('G1').value = 'Caracterización';
  
  // Estilo de encabezados
  ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'].forEach(cell => {
    worksheet.getCell(cell).font = { bold: true };
    worksheet.getCell(cell).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
  });

  // Datos de los inscritos
  inscritos.forEach((inscrito, index) => {
    const row = index + 2;
    worksheet.getCell(`A${row}`).value = inscrito.tipo_documento?.nombre || '';
    worksheet.getCell(`B${row}`).value = inscrito.numero_documento;
    worksheet.getCell(`C${row}`).value = inscrito.nombres;
    worksheet.getCell(`D${row}`).value = inscrito.apellidos;
    worksheet.getCell(`E${row}`).value = inscrito.telefono;
    worksheet.getCell(`F${row}`).value = inscrito.correo;
    worksheet.getCell(`G${row}`).value = inscrito.caracterizacion?.tipo_caracterizacion || '';
  });

  // Ajustar ancho de columnas
  worksheet.columns = [
    { width: 20 }, // A
    { width: 20 }, // B
    { width: 25 }, // C
    { width: 25 }, // D
    { width: 15 }, // E
    { width: 30 }, // F
    { width: 30 }  // G
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

// ✅ FUNCIÓN: Generar Excel para validación de aspirantes (SIN código de ficha)
const generarExcelValidacionAspirantes = async (inscritos, oferta) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Aspirantes a Validar');

  // Columnas - SIN la columna de código de ficha
  worksheet.columns = [
    { header: 'Documento', key: 'documento', width: 20 },
    { header: 'Nombres', key: 'nombres', width: 25 },
    { header: 'Apellidos', key: 'apellidos', width: 25 },
    { header: 'Teléfono', key: 'telefono', width: 15 },
    { header: 'Correo', key: 'correo', width: 30 },
    { header: 'Caracterización', key: 'caracterizacion', width: 25 },
    { header: '¿Aprueba?', key: 'aprueba', width: 15 },
    { header: 'Observaciones', key: 'observaciones', width: 30 }
  ];

  // Estilo del encabezado
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF00643C' }
  };
  worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

  // Nota para el instructor
  worksheet.getCell('G1').note = 'Escribir "SÍ" o "NO" para indicar si el aspirante aprueba la validación';

  // Datos de aspirantes
  inscritos.forEach((inscrito, idx) => {
    const row = idx + 2;
    worksheet.getCell(`A${row}`).value = inscrito.numero_documento;
    worksheet.getCell(`B${row}`).value = inscrito.nombres;
    worksheet.getCell(`C${row}`).value = inscrito.apellidos;
    worksheet.getCell(`D${row}`).value = inscrito.telefono;
    worksheet.getCell(`E${row}`).value = inscrito.correo;
    worksheet.getCell(`F${row}`).value = inscrito.caracterizacion?.tipo_caracterizacion || '';
    worksheet.getCell(`G${row}`).value = '';
    worksheet.getCell(`H${row}`).value = '';
  });

  // Hoja de instructivo
  const instrucciones = workbook.addWorksheet('Instructivo');
  instrucciones.getCell('A1').value = 'INSTRUCTIVO PARA VALIDACIÓN DE ASPIRANTES';
  instrucciones.getCell('A1').font = { bold: true, size: 14 };
  instrucciones.getCell('A3').value = '1. Revise cada aspirante y determine si cumple con los requisitos';
  instrucciones.getCell('A4').value = '2. En la columna "¿Aprueba?" escriba "SÍ" o "NO"';
  instrucciones.getCell('A5').value = '3. En la columna "Observaciones" puede agregar comentarios si es necesario';
  instrucciones.getCell('A6').value = '4. Guarde el archivo y súbalo nuevamente al sistema';
  instrucciones.getCell('A8').value = 'Nota: El código de ficha lo asignará el funcionario directamente en el sistema';

  return workbook;
};

// ✅ FUNCIÓN: Generar Excel para inscripción individual (con código de ficha VACÍO)
// backend/services/excelGenerator.js
// En la función generarExcelInscripcion, asegúrate que la línea D2 esté VACÍA:

const generarExcelInscripcion = async (inscripcion, oferta) => {
  const workbook = new ExcelJS.Workbook();
  
  // ===== HOJA 1: Formato para el sistema =====
  const hoja1 = workbook.addWorksheet('Formato Sistema');
  
  // Encabezados
  hoja1.getCell('A1').value = 'Resultado del Registro (Reservado para el sistema)';
  hoja1.getCell('B1').value = 'Tipo de Documento';
  hoja1.getCell('C1').value = 'Número de Documento';
  hoja1.getCell('D1').value = 'Código de Ficha';  // ← El encabezado se mantiene
  hoja1.getCell('E1').value = 'Caracterización';
  hoja1.getCell('F1').value = '';
  hoja1.getCell('G1').value = 'Código Empresa (solo si la ficha es cerrada)';
  
  // Estilo de encabezados
  ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'].forEach(cell => {
    hoja1.getCell(cell).font = { bold: true };
    hoja1.getCell(cell).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
  });

  // Datos de la inscripción
  hoja1.getCell('A2').value = 'EXITOSO';
  hoja1.getCell('B2').value = inscripcion.tipo_documento?.nombre || '';
  hoja1.getCell('C2').value = inscripcion.numero_documento;
  hoja1.getCell('D2').value = ''; // ← VACÍO - CRÍTICO
  hoja1.getCell('E2').value = inscripcion.caracterizacion?.tipo_caracterizacion || '';
  hoja1.getCell('F2').value = '';
  
  // Si la oferta es cerrada, poner código de empresa
  if (oferta.tipo_oferta?.nombre?.toLowerCase() === 'cerrada') {
    hoja1.getCell('G2').value = oferta.empresa_solicitante?.nit || '';
  }

  // Ajustar ancho de columnas
  hoja1.columns = [
    { width: 30 }, // A
    { width: 20 }, // B
    { width: 20 }, // C
    { width: 20 }, // D
    { width: 30 }, // E
    { width: 10 }, // F
    { width: 25 }  // G
  ];

  // ===== HOJA 2: Datos personales =====
  const hoja2 = workbook.addWorksheet('Datos Personales');
  
  // Encabezados
  hoja2.getCell('A1').value = 'Tipo Documento';
  hoja2.getCell('B1').value = 'Número de Documento';
  hoja2.getCell('C1').value = 'Nombres';
  hoja2.getCell('D1').value = 'Apellidos';
  hoja2.getCell('E1').value = 'Teléfono';
  hoja2.getCell('F1').value = 'Email';
  hoja2.getCell('G1').value = 'Caracterización';
  
  // Estilo de encabezados
  ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1'].forEach(cell => {
    hoja2.getCell(cell).font = { bold: true };
    hoja2.getCell(cell).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
  });

  // Datos de la inscripción
  hoja2.getCell('A2').value = inscripcion.tipo_documento?.nombre || '';
  hoja2.getCell('B2').value = inscripcion.numero_documento;
  hoja2.getCell('C2').value = inscripcion.nombres;
  hoja2.getCell('D2').value = inscripcion.apellidos;
  hoja2.getCell('E2').value = inscripcion.telefono;
  hoja2.getCell('F2').value = inscripcion.correo;
  hoja2.getCell('G2').value = inscripcion.caracterizacion?.tipo_caracterizacion || '';

  // Ajustar ancho de columnas
  hoja2.columns = [
    { width: 20 }, // A
    { width: 20 }, // B
    { width: 25 }, // C
    { width: 25 }, // D
    { width: 15 }, // E
    { width: 30 }, // F
    { width: 30 }  // G
  ];

  // Generar el archivo
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = { 
  generarExcelInscripcion, 
  generarExcelCedulas,
  generarExcelValidacionAspirantes 
};