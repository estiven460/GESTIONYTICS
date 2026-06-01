const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Helper: autoajustar anchos de columna (versión robusta)
const autoFitColumns = (worksheet) => {
  // Ancho mínimo y máximo (en unidades de Excel)
  const MIN_WIDTH = 30;   // mínimo más grande para evitar texto cortado
  const MAX_WIDTH = 80;
  const PADDING = 2;

  // Obtener número de columnas (basado en la primera fila)
  const colCount = worksheet.columns.length;

  for (let i = 1; i <= colCount; i++) {
    let maxLength = 0;

    // Recorrer todas las filas de la columna
    worksheet.getColumn(i).eachCell({ includeEmpty: true }, (cell, rowNumber) => {
      if (cell.value) {
        let cellText = '';
        if (typeof cell.value === 'object' && cell.value.richText) {
          cellText = cell.value.richText.map(rt => rt.text).join('');
        } else {
          cellText = cell.value.toString();
        }
        // Longitud del texto (puedes ajustar si usas caracteres anchos)
        const length = cellText.length;
        if (length > maxLength) maxLength = length;
      }
    });

    // Calcular ancho: longitud + padding, limitado
    let width = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, maxLength + PADDING));
    worksheet.getColumn(i).width = width;

    // Log para depuración (se verá en la consola del backend)
    console.log(`Columna ${i}: maxLength=${maxLength}, ancho asignado=${width}`);
  }
};

const exportarExcelOferta = async (oferta, instructores = [], res = null) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Datos de la Oferta');

    const esCampesena = oferta.es_campesena || false;

    if (esCampesena) {
      await generarExcelCampesena(worksheet, oferta, instructores);
    } else {
      await generarExcelRegular(worksheet, oferta);
    }

    // Aplicar autoajuste DESPUÉS de tener todas las filas
    autoFitColumns(worksheet);

    if (res) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=oferta_${oferta.programa_formacion?.codigo || 'completa'}.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } else {
      const fecha = new Date().toISOString().split('T')[0];
      const fileName = `oferta_${oferta.programa_formacion?.codigo || 'completa'}_${fecha}.xlsx`;
      const filePath = path.join(__dirname, '../uploads/excel', fileName);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      await workbook.xlsx.writeFile(filePath);
      return filePath;
    }
  } catch (error) {
    console.error('Error generando Excel de oferta:', error);
    throw error;
  }
};

// Generar Excel para oferta REGULAR (33 columnas)
const generarExcelRegular = async (worksheet, oferta) => {
  // Definición de columnas (solo para estructura, los anchos se ajustan después)
  worksheet.columns = [
    { header: 'Nombre del instructor', key: 'nombre_instructor', width: 30 },
    { header: 'Correo electrónico', key: 'correo_instructor', width: 30 },
    { header: 'Celular', key: 'celular_instructor', width: 20 },
    { header: 'Nombre del programa', key: 'nombre_programa', width: 40 },
    { header: 'Código del programa', key: 'codigo_programa', width: 20 },
    { header: 'Versión del programa', key: 'version_programa', width: 20 },
    { header: 'Sector del centro', key: 'sector_centro', width: 30 },
    { header: 'Programa especial', key: 'programa_especial', width: 35 },
    { header: 'Cupo de aprendices', key: 'cupo_aprendices', width: 20 },
    { header: 'Tipo de oferta', key: 'tipo_oferta', width: 25 },
    { header: '¿Hace parte de algún convenio?', key: 'convenio', width: 35 },
    { header: 'Nombre de la empresa', key: 'nombre_empresa', width: 40 },
    { header: 'NIT de la empresa', key: 'nit_empresa', width: 20 },
    { header: 'Fecha de creación de la empresa', key: 'fecha_creacion_empresa', width: 25 },
    { header: 'Tipo de empresa', key: 'tipo_empresa', width: 20 },
    { header: 'Dirección de la empresa', key: 'direccion_empresa', width: 40 },
    { header: 'Nombre del representante legal', key: 'representante_legal', width: 35 },
    { header: 'Nombre del contacto en la empresa', key: 'contacto_nombre', width: 35 },
    { header: 'Celular del contacto', key: 'contacto_celular', width: 20 },
    { header: 'Correo del contacto', key: 'contacto_correo', width: 35 },
    { header: 'Número de empleados', key: 'num_empleados', width: 20 },
    { header: 'Municipio de desarrollo', key: 'municipio', width: 30 },
    { header: 'Dirección donde se realiza', key: 'direccion', width: 40 },
    { header: 'Duración en horas', key: 'duracion_horas', width: 18 },
    { header: 'Fecha inicio', key: 'fecha_inicio', width: 18 },
    { header: 'Fecha fin', key: 'fecha_fin', width: 18 },
    { header: 'Horario por día (Mes 1)', key: 'horario_mes1', width: 30 },
    { header: 'Horario por día (Mes 2)', key: 'horario_mes2', width: 30 },
    { header: 'Nombre del dinamizador', key: 'dinamizador', width: 30 },
    { header: 'PDF cédulas de aprendices', key: 'pdf_cedulas', width: 25 },
    { header: 'Formato de inscripción masivo', key: 'formato_inscripcion', width: 25 },
    { header: 'Ficha de caracterización', key: 'ficha_caracterizacion', width: 25 },
    { header: 'Carta de solicitud de la empresa', key: 'carta_solicitud', width: 30 }
  ];

  const calcularHoras = (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return 'N/A';
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffDays = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    return (diffDays * 8).toString();
  };

  worksheet.addRow({
    nombre_instructor: `${oferta.creado_por?.nombre || ''} ${oferta.creado_por?.apellido || ''}`.trim(),
    correo_instructor: oferta.creado_por?.correoElectronico || '',
    celular_instructor: oferta.creado_por?.telefono || '',
    nombre_programa: oferta.programa_formacion?.nombre_programa || '',
    codigo_programa: oferta.programa_formacion?.codigo || '',
    version_programa: oferta.programa_formacion?.version || '',
    sector_centro: 'Centro de Comercio y Servicios',
    programa_especial: oferta.programa_especial?.nombre || 'Ninguno',
    cupo_aprendices: oferta.cupo_maximo || '',
    tipo_oferta: oferta.tipo_oferta?.nombre || '',
    convenio: oferta.convenio?.nombre || 'No',
    nombre_empresa: oferta.empresa_solicitante?.nombre || '',
    nit_empresa: oferta.empresa_solicitante?.nit || '',
    fecha_creacion_empresa: oferta.empresa_solicitante?.fecha_creacion
      ? new Date(oferta.empresa_solicitante.fecha_creacion).toLocaleDateString() : '',
    tipo_empresa: oferta.empresa_solicitante?.tipo_empresa || '',
    direccion_empresa: oferta.empresa_solicitante?.direccion || '',
    representante_legal: oferta.empresa_solicitante?.representante_legal?.nombre_completo || '',
    contacto_nombre: oferta.empresa_solicitante?.contacto?.nombre_completo || '',
    contacto_celular: oferta.empresa_solicitante?.contacto?.telefono || '',
    contacto_correo: oferta.empresa_solicitante?.contacto?.correo || '',
    num_empleados: oferta.empresa_solicitante?.numero_empleados || '',
    municipio: oferta.ubicacion?.municipio?.nombre || '',
    direccion: oferta.ubicacion?.direccion || '',
    duracion_horas: calcularHoras(oferta.fechas?.inicio, oferta.fechas?.fin),
    fecha_inicio: oferta.fechas?.inicio ? new Date(oferta.fechas.inicio).toLocaleDateString() : '',
    fecha_fin: oferta.fechas?.fin ? new Date(oferta.fechas.fin).toLocaleDateString() : '',
    horario_mes1: oferta.horario?.dias?.join(', ') || '',
    horario_mes2: oferta.horario?.dias?.join(', ') || '',
    dinamizador: oferta.coordinador_asignado?.nombre || '',
    pdf_cedulas: 'Pendiente',
    formato_inscripcion: 'Generado',
    ficha_caracterizacion: 'Generada',
    carta_solicitud: oferta.carta_pdf ? 'Adjunta' : 'Pendiente'
  });
};

// Generar Excel para oferta CAMPESENA (48 columnas)
const generarExcelCampesena = async (worksheet, oferta, instructores) => {
  // Ancho inicial genérico (después se ajusta automáticamente)
  const columnHeaders = [
    '¿Tiene la información de los otros instructores?',
    'Nombre completo (Técnico)', 'Correo electrónico (Técnico)', 'Celular (Técnico)',
    'Fechas de ejecución Mes 1 (Técnico)', 'Fechas de ejecución Mes 2 (Técnico)',
    'Fechas de ejecución Mes 3 (Técnico)', 'Fechas de ejecución Mes 4 (Técnico)',
    'Fechas de ejecución Mes 5 (Técnico)',
    'Nombre completo (Empresarial)', 'Correo electrónico (Empresarial)', 'Celular (Empresarial)',
    'Fechas de ejecución Mes 1 (Empresarial)', 'Fechas de ejecución Mes 2 (Empresarial)',
    'Fechas de ejecución Mes 3 (Empresarial)', 'Fechas de ejecución Mes 4 (Empresarial)',
    'Fechas de ejecución Mes 5 (Empresarial)',
    'Nombre completo (Popular)', 'Correo electrónico (Popular)', 'Celular (Popular)',
    'Fechas de ejecución Mes 1 (Popular)', 'Fechas de ejecución Mes 2 (Popular)',
    'Nombre del programa', 'Código del programa', 'Versión del programa',
    'Sector del centro', 'Programa especial', 'Cupo de aprendices', 'Tipo de oferta',
    'Nombre de la empresa', 'NIT de la empresa', 'Fecha de creación de la empresa',
    'Tipo de empresa', 'Dirección de la empresa', 'Nombre del representante legal',
    'Nombre del contacto en la empresa', 'Celular del contacto', 'Correo del contacto',
    'Número de empleados', 'Municipio de desarrollo', 'Dirección donde se realiza',
    'Duración en horas', 'Fecha inicio', 'Fecha fin',
    'PDF cédulas de aprendices', 'Formato de inscripción masivo',
    'Ficha de caracterización', 'Carta de solicitud de la empresa'
  ];

  // Asignar columnas con un ancho base (luego autoFit lo ajustará)
  worksheet.columns = columnHeaders.map(header => ({ header, key: header.replace(/\s/g, '_'), width: 30 }));

  const instructorTecnico = instructores.find(i => i.tipo === 'Técnico') || {};
  const instructorEmpresarial = instructores.find(i => i.tipo === 'Empresarial') || {};
  const instructorPopular = instructores.find(i => i.tipo === 'Popular') || {};

  const getFechasMes = (instructor, mes) => {
    const programacion = instructor.programacion?.find(p => p.mes === mes);
    if (!programacion || !programacion.rangos) return '';
    return programacion.rangos.map(r => 
      `${new Date(r.desde).toLocaleDateString()} - ${new Date(r.hasta).toLocaleDateString()}`
    ).join(', ');
  };

  const calcularHoras = (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return 'N/A';
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diffDays = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24));
    return (diffDays * 8).toString();
  };

  worksheet.addRow({
    '¿Tiene la información de los otros instructores?': 'Sí',
    'Nombre completo (Técnico)': instructorTecnico.nombre || '',
    'Correo electrónico (Técnico)': instructorTecnico.correo || '',
    'Celular (Técnico)': instructorTecnico.celular || '',
    'Fechas de ejecución Mes 1 (Técnico)': getFechasMes(instructorTecnico, 1),
    'Fechas de ejecución Mes 2 (Técnico)': getFechasMes(instructorTecnico, 2),
    'Fechas de ejecución Mes 3 (Técnico)': getFechasMes(instructorTecnico, 3),
    'Fechas de ejecución Mes 4 (Técnico)': getFechasMes(instructorTecnico, 4),
    'Fechas de ejecución Mes 5 (Técnico)': getFechasMes(instructorTecnico, 5),
    'Nombre completo (Empresarial)': instructorEmpresarial.nombre || '',
    'Correo electrónico (Empresarial)': instructorEmpresarial.correo || '',
    'Celular (Empresarial)': instructorEmpresarial.celular || '',
    'Fechas de ejecución Mes 1 (Empresarial)': getFechasMes(instructorEmpresarial, 1),
    'Fechas de ejecución Mes 2 (Empresarial)': getFechasMes(instructorEmpresarial, 2),
    'Fechas de ejecución Mes 3 (Empresarial)': getFechasMes(instructorEmpresarial, 3),
    'Fechas de ejecución Mes 4 (Empresarial)': getFechasMes(instructorEmpresarial, 4),
    'Fechas de ejecución Mes 5 (Empresarial)': getFechasMes(instructorEmpresarial, 5),
    'Nombre completo (Popular)': instructorPopular.nombre || '',
    'Correo electrónico (Popular)': instructorPopular.correo || '',
    'Celular (Popular)': instructorPopular.celular || '',
    'Fechas de ejecución Mes 1 (Popular)': getFechasMes(instructorPopular, 1),
    'Fechas de ejecución Mes 2 (Popular)': getFechasMes(instructorPopular, 2),
    'Nombre del programa': oferta.programa_formacion?.nombre_programa || '',
    'Código del programa': oferta.programa_formacion?.codigo || '',
    'Versión del programa': oferta.programa_formacion?.version || '',
    'Sector del centro': 'Centro de Comercio y Servicios',
    'Programa especial': oferta.programa_especial?.nombre || 'Ninguno',
    'Cupo de aprendices': oferta.cupo_maximo || '',
    'Tipo de oferta': oferta.tipo_oferta?.nombre || '',
    'Nombre de la empresa': oferta.empresa_solicitante?.nombre || '',
    'NIT de la empresa': oferta.empresa_solicitante?.nit || '',
    'Fecha de creación de la empresa': oferta.empresa_solicitante?.fecha_creacion
      ? new Date(oferta.empresa_solicitante.fecha_creacion).toLocaleDateString() : '',
    'Tipo de empresa': oferta.empresa_solicitante?.tipo_empresa || '',
    'Dirección de la empresa': oferta.empresa_solicitante?.direccion || '',
    'Nombre del representante legal': oferta.empresa_solicitante?.representante_legal?.nombre_completo || '',
    'Nombre del contacto en la empresa': oferta.empresa_solicitante?.contacto?.nombre_completo || '',
    'Celular del contacto': oferta.empresa_solicitante?.contacto?.telefono || '',
    'Correo del contacto': oferta.empresa_solicitante?.contacto?.correo || '',
    'Número de empleados': oferta.empresa_solicitante?.numero_empleados || '',
    'Municipio de desarrollo': oferta.ubicacion?.municipio?.nombre || '',
    'Dirección donde se realiza': oferta.ubicacion?.direccion || '',
    'Duración en horas': calcularHoras(oferta.fechas?.inicio, oferta.fechas?.fin),
    'Fecha inicio': oferta.fechas?.inicio ? new Date(oferta.fechas.inicio).toLocaleDateString() : '',
    'Fecha fin': oferta.fechas?.fin ? new Date(oferta.fechas.fin).toLocaleDateString() : '',
    'PDF cédulas de aprendices': 'Pendiente',
    'Formato de inscripción masivo': 'Generado',
    'Ficha de caracterización': 'Generada',
    'Carta de solicitud de la empresa': oferta.carta_pdf ? 'Adjunta' : 'Pendiente'
  });
};

module.exports = { exportarExcelOferta };