const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ===== FUNCIONES AUXILIARES PARA FECHAS (manejo UTC) =====
const parseLocalDate = (fechaInput) => {
  if (!fechaInput) return null;
  if (fechaInput instanceof Date) {
    return new Date(Date.UTC(fechaInput.getUTCFullYear(), fechaInput.getUTCMonth(), fechaInput.getUTCDate()));
  }
  let str = fechaInput;
  if (str.includes('T')) str = str.split('T')[0];
  const [year, month, day] = str.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(Date.UTC(year, month - 1, day));
};

const formatLocalDate = (fechaInput) => {
  if (!fechaInput) return '';
  let year, month, day;
  if (fechaInput instanceof Date) {
    year = fechaInput.getUTCFullYear();
    month = fechaInput.getUTCMonth() + 1;
    day = fechaInput.getUTCDate();
  } else if (typeof fechaInput === 'string') {
    let str = fechaInput;
    if (str.includes('T')) str = str.split('T')[0];
    [year, month, day] = str.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return '';
  } else {
    return '';
  }
  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
};

const generarFichaCaracterizacion = async (oferta) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 12, bottom: 12, left: 28, right: 28 }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const LEFT  = 28;
      const RIGHT = 584;
      const W     = RIGHT - LEFT;

      // ─── Helpers ───────────────────────────────────────────────────────
      const hLine = (y, x1 = LEFT, x2 = RIGHT) =>
        doc.save().lineWidth(0.4).moveTo(x1, y).lineTo(x2, y).stroke().restore();

      const vLine = (x, y1, y2) =>
        doc.save().lineWidth(0.4).moveTo(x, y1).lineTo(x, y2).stroke().restore();

      const boxStroke = (x, y, w, h, lw = 0.5) =>
        doc.save().lineWidth(lw).rect(x, y, w, h).stroke().restore();

      const chk = (x, y, checked = false, size = 8) => {
        doc.save().lineWidth(0.4).rect(x, y, size, size).stroke().restore();
        if (checked) {
          doc.save().fontSize(size - 1).font('Helvetica-Bold').fillColor('black')
            .text('X', x + 1.5, y + 0.5, { lineBreak: false }).restore();
        }
      };

      const txt = (text, x, y, size, font, color, opts = {}) =>
        doc.save().fontSize(size).font(font).fillColor(color)
          .text(text || '', x, y, { lineBreak: false, ...opts })
          .restore();

      // =====================================================================
      // CONSTANTES
      // =====================================================================
      const ROW_H  = 17;
      const PE_H   = 14;
      const HDR_H  = 54;
      const TIPO_H = 16;
      const LBL_W  = 108;
      const VAL_X  = LEFT + LBL_W;
      const VAL_W  = W - LBL_W;

      let y = 12;

      const row = (label, value, extraFn) => {
        hLine(y); hLine(y + ROW_H);
        vLine(LEFT, y, y + ROW_H);
        vLine(RIGHT, y, y + ROW_H);
        vLine(VAL_X, y, y + ROW_H);
        txt(label, LEFT + 2,  y + 4, 6.5, 'Helvetica', '#333',  { width: LBL_W - 4 });
        txt(value, VAL_X + 3, y + 4, 8,   'Helvetica', 'black', { width: VAL_W - 6  });
        if (extraFn) extraFn();
        y += ROW_H;
      };

      // =====================================================================
      // ENCABEZADO
      // =====================================================================
      const LOGO_W = 68;
      const INFO_W = 92;

      boxStroke(LEFT, y, W, HDR_H, 0.8);
      vLine(LEFT + LOGO_W, y, y + HDR_H);
      vLine(RIGHT - INFO_W, y, y + HDR_H);

      try {
        const logoPath = path.join(__dirname, '../public/logosena.png');
        if (fs.existsSync(logoPath)) {
          doc.image(logoPath, LEFT + 3, y + 4, { width: LOGO_W - 8, height: HDR_H - 8 });
        }
      } catch (_) {}

      const MID_X = LEFT + LOGO_W;
      const MID_W = W - LOGO_W - INFO_W;
      txt('SERVICIO NACIONAL DE APRENDIZAJE', MID_X, y + 12, 10,  'Helvetica-Bold', 'black', { width: MID_W, align: 'center' });
      txt('SISTEMA INTEGRADO DE GESTIÓN',     MID_X, y + 26,  8,  'Helvetica',      'black', { width: MID_W, align: 'center' });

      const radicadoTxt =
        `La presente formación se programa en atención a la solicitud con Radicado\n` +
        `No Fecha de asignación desde Coordinación Académica / / ${new Date().getFullYear()}`;
      txt(oferta.radicado_texto || radicadoTxt,
        RIGHT - INFO_W + 3, y + 5, 5.8, 'Helvetica', 'black',
        { width: INFO_W - 6, lineBreak: true });

      y += HDR_H;

      // =====================================================================
      // TIPO DE FORMACIÓN
      // =====================================================================
      boxStroke(LEFT, y, W, TIPO_H, 0.5);
      vLine(LEFT + W / 2, y, y + TIPO_H);

      const esComp = (oferta.tipo_formacion || '').toLowerCase() === 'complementaria';
      chk(LEFT + 16, y + 4, esComp, 8);
      txt('COMPLEMENTARIA', LEFT + 28, y + 4, 8.5, 'Helvetica-Bold', 'black', { width: W / 2 - 32 });
      chk(LEFT + W / 2 + 16, y + 4, !esComp, 8);
      txt('TITULADA', LEFT + W / 2 + 28, y + 4, 8.5, 'Helvetica-Bold', 'black', { width: W / 2 - 32 });

      y += TIPO_H;

      // =====================================================================
      // DATOS DEL PROGRAMA
      // =====================================================================
      row('Código programa*',     oferta.programa_formacion?.codigo);
      row('Nombre del Programa*', oferta.programa_formacion?.nombre_programa);
      row('Versión*',             oferta.programa_formacion?.version);
      row('Duración (Horas)*',    oferta.programa_formacion?.duracion_maxima?.toString());

      const fInicio = formatLocalDate(oferta.fechas?.inicio);
      const fFin    = formatLocalDate(oferta.fechas?.fin);
      row('Fecha Inicio*', fInicio);
      row('Fecha Fin*',    fFin);
      row('Cupo*',         oferta.cupo_maximo?.toString());

      // ─── MODALIDAD ─────────────────────────────────────────────────────
      hLine(y); hLine(y + ROW_H);
      vLine(LEFT, y, y + ROW_H); vLine(RIGHT, y, y + ROW_H); vLine(VAL_X, y, y + ROW_H);
      txt('Modalidad*', LEFT + 2, y + 4, 6.5, 'Helvetica', '#333', { width: LBL_W - 4 });
      const modalidad = (oferta.modalidad?.nombre || '').toLowerCase();
      const modSlot   = VAL_W / 3;
      [['PRESENCIAL','presencial'],['VIRTUAL','virtual'],['COMBINADA','combinada']].forEach(([lbl, key], i) => {
        const mx = VAL_X + i * modSlot + 5;
        chk(mx, y + 5, modalidad.includes(key), 8);
        txt(lbl, mx + 12, y + 4, 7.5, 'Helvetica-Bold', 'black', { width: modSlot - 16 });
      });
      y += ROW_H;

      // ─── UBICACIÓN ─────────────────────────────────────────────────────
      row('Departamento*', oferta.ubicacion?.departamento);
      row('Municipio*',    oferta.ubicacion?.municipio?.nombre);
      row('Dirección*', oferta.ubicacion?.direccion || '');

            // =====================================================================
      // INSTRUCTOR (creado_por) - VERSIÓN DEFINITIVA CON LOGS
      // =====================================================================
      
      console.log('📄 [PDF Generator] Datos recibidos:');
      console.log('- es_campesena:', oferta.es_campesena);
      console.log('- creado_por:', oferta.creado_por);
      console.log('- instructor_nombre:', oferta.instructor_nombre);
      console.log('- instructor_correo:', oferta.instructor_correo);
      console.log('- instructor_identificacion:', oferta.instructor_identificacion);
      console.log('- instructores array:', oferta.instructores ? oferta.instructores.length : 0);
      
      let correoInstructor = '';
      let numeroIdentificacion = '';
      let nombreInstructor = '';
      let telefonoInstructor = '';

      // 1. Intentar desde creado_por (usuario autenticado que creó la oferta)
      if (oferta.creado_por && typeof oferta.creado_por === 'object') {
        correoInstructor = oferta.creado_por.correoElectronico || oferta.creado_por.email || '';
        numeroIdentificacion = oferta.creado_por.numeroIdentificacion || oferta.creado_por.identificacion || '';
        nombreInstructor = oferta.creado_por.nombre && oferta.creado_por.apellido 
          ? `${oferta.creado_por.nombre} ${oferta.creado_por.apellido}`
          : oferta.creado_por.nombreUsuario || oferta.creado_por.nombre || '';
        telefonoInstructor = oferta.creado_por.telefono || '';
        console.log('📄 Desde creado_por:', { nombreInstructor, correoInstructor, numeroIdentificacion });
      }
      
      // 2. Si es Campesena y faltan datos, usar datos de respaldo guardados en la oferta
      if (oferta.es_campesena) {
        if (!correoInstructor && oferta.instructor_correo) {
          correoInstructor = oferta.instructor_correo;
          console.log('📄 Usando instructor_correo de respaldo:', correoInstructor);
        }
        if (!numeroIdentificacion && oferta.instructor_identificacion) {
          numeroIdentificacion = oferta.instructor_identificacion;
          console.log('📄 Usando instructor_identificacion de respaldo:', numeroIdentificacion);
        }
        if (!nombreInstructor && oferta.instructor_nombre) {
          nombreInstructor = oferta.instructor_nombre;
          console.log('📄 Usando instructor_nombre de respaldo:', nombreInstructor);
        }
        if (!telefonoInstructor && oferta.instructor_telefono) {
          telefonoInstructor = oferta.instructor_telefono;
        }
      }
      
      // 3. Si aún faltan datos y es Campesena, buscar en instructores cargados
      if (oferta.es_campesena && (!correoInstructor || !numeroIdentificacion || !nombreInstructor)) {
        if (oferta.instructores && Array.isArray(oferta.instructores)) {
          const instructorTecnico = oferta.instructores.find(inst => inst.tipo === 'Técnico');
          if (instructorTecnico) {
            if (!correoInstructor) correoInstructor = instructorTecnico.correo || '';
            if (!numeroIdentificacion) numeroIdentificacion = instructorTecnico.identificacion || '';
            if (!nombreInstructor) nombreInstructor = instructorTecnico.nombre || '';
            if (!telefonoInstructor) telefonoInstructor = instructorTecnico.celular || '';
            console.log('📄 Datos desde instructor Técnico:', {
              nombre: nombreInstructor,
              correo: correoInstructor,
              identificacion: numeroIdentificacion
            });
          }
        }
      }
      
      // 4. Valores por defecto si todo falla
      if (!nombreInstructor) nombreInstructor = 'No especificado';
      if (!correoInstructor) correoInstructor = 'No disponible';
      if (!numeroIdentificacion) numeroIdentificacion = 'No disponible';

      console.log('📄 DATOS FINALES DEL INSTRUCTOR PARA PDF:', {
        nombre: nombreInstructor,
        correo: correoInstructor,
        identificacion: numeroIdentificacion
      });

      // ─── FILA 1: NOMBRE DEL INSTRUCTOR CON CC ─────────────────────────────
      hLine(y); hLine(y + ROW_H);
      vLine(LEFT, y, y + ROW_H);
      vLine(RIGHT, y, y + ROW_H);
      vLine(VAL_X, y, y + ROW_H);
      txt('Instructor*', LEFT + 2, y + 4, 6.5, 'Helvetica', '#333', { width: LBL_W - 4 });

      const CC_W  = 90;
      const NOM_W = VAL_W - CC_W;
      vLine(VAL_X + NOM_W, y, y + ROW_H);

      txt(nombreInstructor, VAL_X + 3, y + 4, 8, 'Helvetica', 'black', { width: NOM_W - 6 });

      txt('CC #', VAL_X + NOM_W + 3, y + 5, 6, 'Helvetica', '#333', { width: 22 });
      txt(numeroIdentificacion, VAL_X + NOM_W + 25, y + 4, 8, 'Helvetica', 'black', { width: CC_W - 28 });

      y += ROW_H;

      // ─── FILA 2: CORREO DEL INSTRUCTOR ────────────────────────────────────
      hLine(y); hLine(y + ROW_H);
      vLine(LEFT, y, y + ROW_H);
      vLine(RIGHT, y, y + ROW_H);
      vLine(VAL_X, y, y + ROW_H);
      txt('Correo*', LEFT + 2, y + 4, 6.5, 'Helvetica', '#333', { width: LBL_W - 4 });
      txt(correoInstructor, VAL_X + 3, y + 4, 8, 'Helvetica', 'black', { width: VAL_W - 6 });

      y += ROW_H;

      
      // ─── EMPRESA SOLICITANTE ─────────────────────────────────────────────
      hLine(y); hLine(y + ROW_H);
      vLine(LEFT, y, y + ROW_H); vLine(RIGHT, y, y + ROW_H); vLine(VAL_X, y, y + ROW_H);
      txt('Empresa solicitante*', LEFT + 2, y + 4, 6.5, 'Helvetica', '#333', { width: LBL_W - 4 });
      
      const empresaRaw = oferta.empresa_solicitante || {};
      const nombreEmpresa = typeof empresaRaw === 'object' && empresaRaw.nombre
        ? empresaRaw.nombre
        : '';
      
      txt(nombreEmpresa, VAL_X + 3, y + 4, 8, 'Helvetica', 'black', { width: VAL_W - 6 });
      
      y += ROW_H;

      // ─── SUBSECTOR ECONÓMICO ───────────────────────────────────────────
      row('Subsector económico*', oferta.subsector_economico?.nombre);

      
      // =====================================================================
      // PROGRAMA ESPECIAL
      // =====================================================================
      const programasEspeciales = [
        'SENA emprende Rural',
        'Aulas Abiertas',
        'Programa de Emprendimiento',
        'SENA emprende Rural POST-CONFLICTO',
        'Cátedra Virtual de Productividad',
        'Programa de Bilingüismo',
        'Jóvenes Rurales sin alianzas',
        'Capacidad de Gestión de Exportaciones',
        'LEOS - Laboratorios Experimentales',
        'Aula Móvil',
        'Ambientes Virtuales de Aprendizaje',
        'Cátedra Virtual de Pensamiento Empresarial',
        'Programa Jóvenes en Acción',
        'Alianzas Estratégicas',
        'Altas Gerencia'
      ];

      const programaEspecialRaw = oferta.programa_especial;
      let programaSeleccionado = '';
      if (programaEspecialRaw && typeof programaEspecialRaw === 'object') {
        programaSeleccionado = programaEspecialRaw.nombre || '';
      } else if (typeof programaEspecialRaw === 'string') {
        programaSeleccionado = programaEspecialRaw;
      }

      const normalize = (str) => {
        return (str || '')
          .toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .trim();
      };

      const progSeleccionadoNorm = normalize(programaSeleccionado);

      const PE_CHK_W   = 20;
      const PE_TOTAL_H = programasEspeciales.length * PE_H;

      hLine(y); hLine(y + PE_TOTAL_H);
      vLine(LEFT,  y, y + PE_TOTAL_H);
      vLine(RIGHT, y, y + PE_TOTAL_H);
      vLine(VAL_X, y, y + PE_TOTAL_H);
      vLine(VAL_X + PE_CHK_W, y, y + PE_TOTAL_H);

      txt('Programa Especial*', LEFT + 2, y + PE_TOTAL_H / 2 - 7, 6.5, 'Helvetica', '#333',
        { width: LBL_W - 4, lineBreak: true });

      programasEspeciales.forEach((prog, i) => {
        const py = y + i * PE_H;
        if (i > 0) hLine(py, VAL_X, RIGHT);

        const progNorm = normalize(prog);
        const isChecked = progSeleccionadoNorm.length > 0 && progSeleccionadoNorm === progNorm;

        chk(VAL_X + 5, py + (PE_H - 8) / 2, isChecked, 8);
        txt(prog, VAL_X + PE_CHK_W + 2, py + (PE_H - 7) / 2, 7, 'Helvetica', 'black',
          { width: VAL_W - PE_CHK_W - 4 });
      });

      y += PE_TOTAL_H;

      // ─── CONVENIO ──────────────────────────────────────────────────────
      row('Convenio', oferta.convenio?.nombre || '');
      
      // ─── AMBIENTE ──────────────────────────────────────────────────────
      row('Ambiente', oferta.ambiente?.nombre || '');

      // =====================================================================
      // OBTENER MODO (REGULAR O CAMPESENA)
      // =====================================================================
      const esCampesena = oferta.es_campesena || false;

      // =====================================================================
      // DÍAS DE LA SEMANA - SOLO PARA REGULAR
      // =====================================================================
      if (!esCampesena) {
        hLine(y); hLine(y + ROW_H);
        vLine(LEFT, y, y + ROW_H); vLine(RIGHT, y, y + ROW_H); vLine(VAL_X, y, y + ROW_H);
        txt('Días semana*', LEFT + 2, y + 4, 6.5, 'Helvetica', '#333', { width: LBL_W - 4 });

        const diasLetras  = ['L','M','M','J','V','S','D'];
        const diasNombres = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
        const diasOferta  = oferta.horario?.dias || [];
        const diasSlot    = VAL_W / 7;

        diasLetras.forEach((letra, i) => {
          const dx = VAL_X + i * diasSlot;
          vLine(dx, y, y + ROW_H);
          const checked = diasOferta.some(d =>
            d.toLowerCase().startsWith(diasNombres[i].toLowerCase().substring(0, 3)));
          chk(dx + 4, y + 5, checked, 8);
          txt(letra, dx + 15, y + 4, 7.5, 'Helvetica-Bold', 'black', { width: diasSlot - 18 });
        });
        y += ROW_H;
      }

      // =====================================================================
      // CÁLCULO DE FECHAS POR MES PARA CAMPESENA (con rangos completos)
      // =====================================================================
      const calcularRangosPorMes = (fechaInicio, fechaFin) => {
        if (!fechaInicio || !fechaFin) return { mes1: '', mes2: '', mes3: '', mes4: '', mes5: '' };
        
        const inicio = parseLocalDate(fechaInicio);
        const fin = parseLocalDate(fechaFin);
        if (!inicio || !fin) return { mes1: '', mes2: '', mes3: '', mes4: '', mes5: '' };
        
        const rangosPorMes = {};
        let currentDate = new Date(inicio);
        let rangoActual = { inicio: new Date(currentDate), fin: null };
        let mesActual = currentDate.getUTCMonth();
        let añoActual = currentDate.getUTCFullYear();
        
        const avanzarDia = () => {
          currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        };
        
        const cerrarRango = () => {
          if (rangoActual.fin) {
            const key = `${añoActual}-${mesActual + 1}`;
            if (!rangosPorMes[key]) rangosPorMes[key] = [];
            rangosPorMes[key].push({
              desde: new Date(rangoActual.inicio),
              hasta: new Date(rangoActual.fin)
            });
          }
        };
        
        while (currentDate <= fin) {
          const mes = currentDate.getUTCMonth();
          const año = currentDate.getUTCFullYear();
          
          if (mes !== mesActual || año !== añoActual) {
            cerrarRango();
            mesActual = mes;
            añoActual = año;
            rangoActual = { inicio: new Date(currentDate), fin: null };
          }
          
          rangoActual.fin = new Date(currentDate);
          avanzarDia();
          
          if (currentDate > fin) {
            cerrarRango();
          }
        }
        
        // NUEVA FUNCIÓN: genera lista de días individuales
        const formatearRango = (rangos) => {
          if (!rangos || rangos.length === 0) return '';
          const dias = [];
          rangos.forEach(r => {
            const desde = r.desde.getUTCDate();
            const hasta = r.hasta.getUTCDate();
            for (let d = desde; d <= hasta; d++) {
              dias.push(d);
            }
          });
          return dias.join(', ');
        };
        
        const mesesOrdenados = Object.keys(rangosPorMes).sort();
        
        return {
          mes1: mesesOrdenados[0] ? formatearRango(rangosPorMes[mesesOrdenados[0]]) : '',
          mes2: mesesOrdenados[1] ? formatearRango(rangosPorMes[mesesOrdenados[1]]) : '',
          mes3: mesesOrdenados[2] ? formatearRango(rangosPorMes[mesesOrdenados[2]]) : '',
          mes4: mesesOrdenados[3] ? formatearRango(rangosPorMes[mesesOrdenados[3]]) : '',
          mes5: mesesOrdenados[4] ? formatearRango(rangosPorMes[mesesOrdenados[4]]) : ''
        };
      };
      // Calcular fechas según el modo
      let mes1 = '', mes2 = '', mes3 = '', mes4 = '', mes5 = '';

      if (esCampesena) {
        const rangos = calcularRangosPorMes(oferta.fechas?.inicio, oferta.fechas?.fin);
        mes1 = rangos.mes1;
        mes2 = rangos.mes2;
        mes3 = rangos.mes3;
        mes4 = rangos.mes4;
        mes5 = rangos.mes5;
      } else {
        const fechas = calcularRangosPorMes(oferta.fechas?.inicio, oferta.fechas?.fin);
        mes1 = fechas.mes1;
        mes2 = fechas.mes2;
        mes3 = fechas.mes3;
        mes4 = fechas.mes4;
        mes5 = fechas.mes5;
      }

      // ─── HORARIO / FECHAS ─────────────────────────────────────────────
      const horaInicio = oferta.horario?.hora_inicio || '';
      const horaFin    = oferta.horario?.hora_fin    || '';
      
      // Para Regular: mostrar horario
      if (!esCampesena) {
        row('Horario*', horaInicio && horaFin ? `${horaInicio} a ${horaFin}` : horaInicio || horaFin);
      }
      
      // Mostrar meses según el modo
      if (mes1) row('Fechas mes 1', mes1);
      
      if (esCampesena) {
        // Campesena: mostrar hasta 5 meses
        if (mes2) row('Fechas mes 2', mes2);
        if (mes3) row('Fechas mes 3', mes3);
        if (mes4) row('Fechas mes 4', mes4);
        if (mes5) row('Fechas mes 5', mes5);
      } else {
        // Regular: solo mostrar mes2 si existe
        if (mes2) row('Fechas mes 2', mes2);
      }
      
      // ─── CÓDIGOS ──────────────────────────────────────────────────────
      const codigoPrograma = oferta.programa_formacion?.codigo || '';
      row('Código solicitud', oferta.codigo_solicitud || '');
      row('Código ficha', codigoPrograma);

      const fInscripcion = formatLocalDate(oferta.createdAt);
      row('Fecha inscripción', fInscripcion);

      hLine(y);

      // ─── OBSERVACIONES ─────────────────────────────────────────────────
      if (oferta.observaciones) {
        const OBS_H = ROW_H;
        hLine(y + OBS_H);
        vLine(LEFT, y, y + OBS_H); vLine(RIGHT, y, y + OBS_H); vLine(VAL_X, y, y + OBS_H);
        txt('Observaciones', LEFT + 2, y + 4, 6.5, 'Helvetica', '#333', { width: LBL_W - 4 });
        doc.save().fontSize(7).font('Helvetica').fillColor('black')
          .text(oferta.observaciones, VAL_X + 3, y + 4,
            { width: VAL_W - 6, lineBreak: false }).restore();
        y += OBS_H;
        hLine(y);
      }

      // =====================================================================
      // FIRMAS
      // =====================================================================
      y += 16;

      const sigMid = LEFT + W / 2;
      const lineY  = y + 20;

      // ---- FIRMA DEL INSTRUCTOR (imagen redimensionada) ----
      const firmaPath = oferta.firma_digital_pdf;
      if (firmaPath && fs.existsSync(firmaPath)) {
        try {
          const ext = path.extname(firmaPath).toLowerCase();
          if (['.png', '.jpg', '.jpeg'].includes(ext)) {
            const maxWidth = 150;
            const maxHeight = 40;
            doc.image(firmaPath, LEFT + 15, lineY - maxHeight, {
              width: maxWidth,
              height: maxHeight,
              fit: [maxWidth, maxHeight]
            });
          }
        } catch (imgError) {
          console.error('Error cargando imagen de firma:', imgError);
        }
      }

      // Línea de firma del instructor (siempre presente)
      doc.save().lineWidth(0.5)
        .moveTo(LEFT + 15, lineY).lineTo(sigMid - 15, lineY).stroke().restore();

      // Línea de Vo.Bo. Coordinador
      doc.save().lineWidth(0.5)
        .moveTo(sigMid + 15, lineY).lineTo(RIGHT - 15, lineY).stroke().restore();

      txt('Firma Instructor',
        LEFT, lineY + 4, 7.5, 'Helvetica', '#444', { width: W / 2, align: 'center' });
      txt('Vo.Bo. Coordinador Académico',
        sigMid, lineY + 4, 7.5, 'Helvetica', '#444', { width: W / 2, align: 'center' });

      txt(`GFO-F-027 v04  |  ${new Date().toLocaleString('es-CO')}`,
        LEFT, lineY + 18, 5.5, 'Helvetica', '#bbb', { width: W, align: 'center' });
        
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { generarFichaCaracterizacion };