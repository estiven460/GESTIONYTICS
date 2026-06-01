import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatISODateToLocal } from '../utils/dateUtils';

const RevisarSolicitud = ({ solicitudId, onClose, onActualizar }) => {
  const [solicitud, setSolicitud] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [archivos, setArchivos] = useState({
    ficha: false,
    carta: false,
    excel: false,
    cedulas: false
  });
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');

  // Motivos de rechazo predefinidos
  const motivosRechazo = [
    { 
      id: 'cupos_insuficientes', 
      titulo: '📊 Cupos insuficientes',
      mensaje: '❌ MOTIVO: Cupos insuficientes\n\nEl número de cupos es muy bajo para la demanda esperada.\n\nPara poder aprobar la oferta, debe:\n1. Habilitar más cupos desde la sección "Links de Inscripción"\n2. Una vez aumentados los cupos, reenviar la solicitud.'
    },
    { 
      id: 'documentacion_incompleta', 
      titulo: '📄 Documentación incompleta',
      mensaje: '❌ MOTIVO: Documentación incompleta\n\nFaltan documentos requeridos o están incompletos.\n\nDocumentos faltantes o incorrectos:\n- [ ] Especifique aquí qué documento falta\n- [ ] Especifique aquí qué documento está incorrecto\n\nPor favor, adjunte los documentos corregidos y reenvíe la solicitud.'
    },
    { 
      id: 'errores_formato', 
      titulo: '✏️ Errores en el formato',
      mensaje: '❌ MOTIVO: Errores en el formato\n\nHay errores en el diligenciamiento del formato.\n\nCampos con errores:\n- [ ] Especifique aquí el campo con error\n- [ ] Especifique aquí la corrección necesaria\n\nPor favor, corrija los campos indicados y reenvíe la solicitud.'
    },
    { 
      id: 'fechas_inconsistentes', 
      titulo: '📅 Fechas inconsistentes',
      mensaje: '❌ MOTIVO: Fechas inconsistentes\n\nLas fechas de inicio o fin no son coherentes con el calendario académico.\n\nPor favor, ajuste las fechas de inicio y/o fin según el calendario académico y reenvíe la solicitud.'
    },
    { 
      id: 'horario_no_valido', 
      titulo: '⏰ Horario no válido',
      mensaje: '❌ MOTIVO: Horario no válido\n\nEl horario propuesto no cumple con los lineamientos del SENA.\n\nPor favor, modifique el horario para que cumpla con las horas mínimas requeridas y reenvíe la solicitud.'
    },
    { 
      id: 'instructor_no_certificado', 
      titulo: '👨‍🏫 Instructor no certificado',
      mensaje: '❌ MOTIVO: Instructor no certificado\n\nEl instructor asignado no cuenta con la certificación requerida para este programa.\n\nPor favor, asigne un instructor que cumpla con los requisitos del programa y reenvíe la solicitud.'
    },
    { 
      id: 'cupos_agotados', 
      titulo: '🚫 Cupos agotados',
      mensaje: '❌ MOTIVO: Cupos agotados\n\nLa oferta ya completó todos los cupos disponibles.\n\nPara poder reenviar la solicitud, debe:\n1. Habilitar más cupos desde la sección "Links de Inscripción"\n2. Una vez aumentados los cupos, reenviar la solicitud.'
    },
    { 
      id: 'otro', 
      titulo: '📌 Otro motivo',
      mensaje: '❌ MOTIVO: Rechazo de solicitud\n\nPor favor, revise los siguientes aspectos:\n- [ ] Especifique aquí el motivo\n\nRealice las correcciones necesarias y reenvíe la solicitud.'
    }
  ];

  useEffect(() => {
    if (solicitudId) {
      cargarSolicitud();
    }
  }, [solicitudId]);

  const cargarSolicitud = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/solicitudes/${solicitudId}`);
      const data = response.data.data;
      setSolicitud(data);
      
      try {
        const archivosRes = await api.get(`/solicitudes/${solicitudId}/archivos`);
        setArchivos(archivosRes.data.data);
      } catch (error) {
        console.log('No se pudieron verificar archivos');
      }
      
    } catch (error) {
      console.error('Error cargando solicitud:', error);
      setError('Error al cargar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async () => {
    try {
      setEnviando(true);
      await api.put(`/solicitudes/${solicitudId}/aprobar`, {
        comentarios: 'Aprobada por coordinador'
      });
      
      if (onActualizar) onActualizar();
      if (onClose) onClose();
      
    } catch (error) {
      console.error('Error aprobando solicitud:', error);
      setError('Error al aprobar la solicitud');
    } finally {
      setEnviando(false);
    }
  };

  const aplicarMotivoPredefinido = (motivo) => {
    setMotivoSeleccionado(motivo.id);
    setObservaciones(motivo.mensaje);
  };

  const handleRechazar = async () => {
    if (!observaciones.trim()) {
      setError('Debe escribir una observación explicando el motivo del rechazo');
      return;
    }

    try {
      setEnviando(true);
      await api.put(`/solicitudes/${solicitudId}/rechazar`, {
        comentarios: observaciones
      });
      
      if (onActualizar) onActualizar();
      if (onClose) onClose();
      
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      setError('Error al rechazar la solicitud');
    } finally {
      setEnviando(false);
    }
  };

  const descargarArchivo = async (tipo) => {
    try {
      const response = await api.get(`/solicitudes/${solicitudId}/descargar/${tipo}`, {
        responseType: 'blob'
      });
      
      let extension = '.pdf';
      if (tipo === 'excel') extension = '.xlsx';
      
      const contentType = response.headers['content-type'];
      if (contentType) {
        if (contentType.includes('spreadsheet') || contentType.includes('excel')) extension = '.xlsx';
        else if (contentType.includes('pdf')) extension = '.pdf';
      }
      
      let nombrePrograma = 'documento';
      if (solicitud?.oferta_id?.programa_formacion) {
        nombrePrograma = solicitud.oferta_id.programa_formacion.nombre_programa || 
                         solicitud.oferta_id.programa_formacion.codigo || 
                         'programa';
      }
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${tipo}_${nombrePrograma.replace(/\s+/g, '_')}${extension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (error) {
      console.error('Error descargando:', error);
    }
  };

  const formatFecha = (fecha) => formatISODateToLocal(fecha);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006c49] mx-auto mb-4"></div>
          <p className="text-[#45474c]">Cargando solicitud...</p>
        </div>
      </div>
    );
  }

  if (!solicitud) {
    return (
      <div className="bg-white rounded-xl shadow-lg overflow-hidden max-w-3xl mx-auto">
        <div className="p-6 text-center">
          <div className="text-[#93000a] mb-4">❌ Solicitud no encontrada</div>
          <button onClick={onClose} className="px-4 py-2 bg-[#006c49] text-white rounded-lg hover:bg-[#004a2b] transition">Cerrar</button>
        </div>
      </div>
    );
  }

  // Extraer datos con manejo seguro de la estructura
  const oferta = solicitud.oferta_id;
  const programa = oferta?.programa_formacion;
  const instructor = solicitud.instructor_id;
  const modalidad = oferta?.modalidad?.nombre || 'N/A';
  const tipoOferta = oferta?.tipo_oferta?.nombre || 'N/A';
  const esCampesena = oferta?.es_campesena || oferta?.modo === 'campesena' || false;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-[900px]">
      {/* Header Section */}
      <header className="flex justify-between items-center p-5 bg-white border-b border-[#c5c6cd]">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📋</span>
          <h1 className="text-xl md:text-2xl font-semibold text-[#006c49]">Revisar Solicitud de Validación</h1>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#eff4ff] transition-colors active:scale-90"
        >
          <span className="material-symbols-outlined text-[#75777d]">close</span>
        </button>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="mx-5 mt-5 p-3 rounded-lg bg-[#ffdad6] text-[#93000a] flex items-center gap-2">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Section 1: Información de la Oferta */}
      <section className="p-5 border-b border-[#c5c6cd]">
        <h2 className="text-lg font-semibold text-[#006c49] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">info</span>
          Información de la Oferta
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[#006c49]">pin_drop</span>
            <div>
              <p className="text-xs text-[#75777d]">Código del Programa</p>
              <p className="text-sm font-semibold text-[#0b1c30]">{programa?.codigo || oferta?.codigo_ficha || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[#006c49]">school</span>
            <div>
              <p className="text-xs text-[#75777d]">Nombre del Programa</p>
              <p className="text-sm font-semibold text-[#0b1c30]">
                {programa?.nombre_programa || programa?.nombre || oferta?.programa_nombre || 'GESTIONYTICS'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[#006c49]">person</span>
            <div>
              <p className="text-xs text-[#75777d]">Instructor</p>
              <p className="text-sm font-semibold text-[#0b1c30]">{instructor?.nombre} {instructor?.apellido || ''}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[#006c49]">mail</span>
            <div>
              <p className="text-xs text-[#75777d]">Email del Instructor</p>
              <p className="text-sm font-semibold text-[#0b1c30]">{instructor?.correoElectronico || instructor?.email || 'N/A'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Detalles de la Solicitud */}
      <section className="p-5 border-b border-[#c5c6cd]">
        <h2 className="text-lg font-semibold text-[#006c49] mb-4">Detalles de la Solicitud</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="flex items-center justify-between p-3 bg-[#eff4ff] rounded-lg">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#75777d] text-sm">calendar_month</span>
              <span className="text-xs font-medium text-[#45474c]">Fecha de Solicitud</span>
            </div>
            <span className="text-sm font-medium">{formatFecha(solicitud.fecha_solicitud)}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#eff4ff] rounded-lg">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#75777d] text-sm">label</span>
              <span className="text-xs font-medium text-[#45474c]">Tipo de Programa</span>
            </div>
            <span className="text-sm font-medium">{esCampesena ? 'Campesena' : 'Regular'}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#eff4ff] rounded-lg">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#75777d] text-sm">door_open</span>
              <span className="text-xs font-medium text-[#45474c]">Tipo de Oferta</span>
            </div>
            <span className="text-sm font-medium">{tipoOferta}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#eff4ff] rounded-lg">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#75777d] text-sm">analytics</span>
              <span className="text-xs font-medium text-[#45474c]">Estado</span>
            </div>
            <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">PENDIENTE</span>
          </div>
        </div>
        
        {/* Horario si existe */}
        {oferta?.horario && (
          <div className="mt-3 p-3 bg-[#eff4ff] rounded-lg">
            <p className="text-xs font-medium text-[#45474c] mb-2">Horario de Formación</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-[#75777d]">Horario:</span>{' '}
                <span className="font-medium">{oferta.horario?.hora_inicio || 'N/A'} - {oferta.horario?.hora_fin || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[#75777d]">Días:</span>{' '}
                <span className="font-medium">
                  {oferta.horario?.dias?.length > 0 
                    ? oferta.horario.dias.slice(0, 3).join(', ') + (oferta.horario.dias.length > 3 ? '...' : '')
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {solicitud.mensaje && (
          <div className="mt-3 p-4 border border-[#c5c6cd] rounded-lg bg-[#f8f9ff] italic flex gap-3">
            <span className="material-symbols-outlined text-[#75777d]">chat</span>
            <p className="text-sm text-[#45474c]">"{solicitud.mensaje}"</p>
          </div>
        )}
      </section>

      {/* Section 3: Documentos Adjuntos */}
      <section className="p-5 border-b border-[#c5c6cd]">
        <h2 className="text-lg font-semibold text-[#006c49] mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined">attach_file</span> Documentos Adjuntos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button 
            onClick={() => descargarArchivo('ficha')}
            disabled={!archivos.ficha}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all group relative ${
              archivos.ficha 
                ? 'border-2 border-[#006c49]/30 bg-[#006c49]/5 hover:bg-[#006c49]/10 cursor-pointer' 
                : 'border-2 border-[#c5c6cd] bg-[#eff4ff]/20 cursor-not-allowed opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-3xl mb-2 text-[#006c49]">description</span>
            <span className="text-xs font-medium text-[#006c49]">Ficha</span>
            {archivos.ficha && (
              <span className="absolute top-2 right-2 material-symbols-outlined text-[#006c49] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            )}
            {!archivos.ficha && (
              <span className="absolute top-2 right-2 material-symbols-outlined text-[#75777d] text-sm">cancel</span>
            )}
          </button>
          
          <button 
            onClick={() => descargarArchivo('carta')}
            disabled={!archivos.carta}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all group relative ${
              archivos.carta 
                ? 'border-2 border-[#006c49]/30 bg-[#006c49]/5 hover:bg-[#006c49]/10 cursor-pointer' 
                : 'border-2 border-[#c5c6cd] bg-[#eff4ff]/20 cursor-not-allowed opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-3xl mb-2 text-[#006c49]">mail</span>
            <span className="text-xs font-medium text-[#006c49]">Carta</span>
            {archivos.carta && (
              <span className="absolute top-2 right-2 material-symbols-outlined text-[#006c49] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            )}
            {!archivos.carta && (
              <span className="absolute top-2 right-2 material-symbols-outlined text-[#75777d] text-sm">cancel</span>
            )}
          </button>
          
          <button 
            onClick={() => descargarArchivo('excel')}
            disabled={!archivos.excel}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all group relative ${
              archivos.excel 
                ? 'border-2 border-[#006c49]/30 bg-[#006c49]/5 hover:bg-[#006c49]/10 cursor-pointer' 
                : 'border-2 border-[#c5c6cd] bg-[#eff4ff]/20 cursor-not-allowed opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-3xl mb-2 text-[#006c49]">table_chart</span>
            <span className="text-xs font-medium text-[#006c49]">Excel</span>
            {archivos.excel && (
              <span className="absolute top-2 right-2 material-symbols-outlined text-[#006c49] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            )}
            {!archivos.excel && (
              <span className="absolute top-2 right-2 material-symbols-outlined text-[#75777d] text-sm">cancel</span>
            )}
          </button>
          
          <button 
            onClick={() => descargarArchivo('cedulas')}
            disabled={!archivos.cedulas}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all group relative ${
              archivos.cedulas 
                ? 'border-2 border-[#006c49]/30 bg-[#006c49]/5 hover:bg-[#006c49]/10 cursor-pointer' 
                : 'border-2 border-[#c5c6cd] bg-[#eff4ff]/20 cursor-not-allowed opacity-60'
            }`}
          >
            <span className="material-symbols-outlined text-3xl mb-2 text-[#006c49]">picture_as_pdf</span>
            <span className="text-xs font-medium text-[#006c49]">Cédulas PDF</span>
            {archivos.cedulas && (
              <span className="absolute top-2 right-2 material-symbols-outlined text-[#006c49] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            )}
            {!archivos.cedulas && (
              <span className="absolute top-2 right-2 material-symbols-outlined text-[#75777d] text-sm">cancel</span>
            )}
          </button>
        </div>
        <p className="text-xs text-[#75777d] mt-3 italic text-center">
          * Revise que todos los documentos estén completos antes de rechazar
        </p>
      </section>

      {/* Action Grid - Rechazar y Aprobar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5">
        {/* Rechazar Solicitud - CON MOTIVOS PREDEFINIDOS */}
        <section className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-200">
          <h2 className="text-lg font-semibold text-[#ba1a1a] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined">cancel</span> Rechazar
          </h2>
          
          {/* Botones de motivos predefinidos */}
          <div className="mb-4">
            <label className="text-xs font-medium text-[#93000a] block mb-2">📌 Motivos comunes (click para usar):</label>
            <div className="flex flex-wrap gap-2">
              {motivosRechazo.map(motivo => (
                <button
                  key={motivo.id}
                  onClick={() => aplicarMotivoPredefinido(motivo)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                    motivoSeleccionado === motivo.id
                      ? 'bg-[#ba1a1a] text-white'
                      : 'bg-white text-[#93000a] border border-red-300 hover:bg-red-100'
                  }`}
                >
                  {motivo.titulo}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-xs font-medium text-[#93000a] block mb-1">
              Motivo del rechazo <span className="text-red-600">*</span>
            </label>
            <textarea 
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full rounded-lg border border-[#c5c6cd] focus:ring-2 focus:ring-[#ba1a1a] focus:border-[#ba1a1a] bg-white p-3 text-sm resize-y"
              rows="5"
              placeholder="Explique detalladamente qué debe corregir el instructor..."
            />
          </div>
          
          {/* Vista previa de lo que verá el instructor */}
          {observaciones && (
            <div className="mt-3 p-3 bg-white rounded-lg border border-red-200">
              <p className="text-xs font-bold text-[#93000a] mb-2 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">preview</span>
                Vista previa (lo que verá el instructor en "Mis Ofertas"):
              </p>
              <div className="bg-red-50 p-2 rounded text-xs text-red-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {observaciones}
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-2 p-2 bg-red-100 rounded-lg mt-3">
            <span className="material-symbols-outlined text-[#ba1a1a] text-sm">warning</span>
            <p className="text-xs text-[#93000a]">
              Al rechazar, el instructor recibirá este comentario y se mostrará en "Mis Ofertas" con el motivo completo.
            </p>
          </div>
          
          <button 
            onClick={handleRechazar}
            disabled={enviando || !observaciones.trim()}
            className={`w-full mt-3 bg-[#ba1a1a] text-white font-bold py-2.5 rounded-lg hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            <span className="material-symbols-outlined text-sm">close</span>
            {enviando ? 'Procesando...' : 'Rechazar solicitud'}
          </button>
        </section>

        {/* Aprobar Solicitud */}
        <section className="bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-200">
          <h2 className="text-lg font-semibold text-[#006c49] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined">check_circle</span> Aprobar
          </h2>
          <div className="flex flex-col gap-3">
            <div className="flex-1">
              <p className="text-sm text-[#005236] mb-3">
                Confirme que todos los documentos cumplen con la normativa del SENA para proceder con la creación de la ficha.
              </p>
              <div className="flex items-start gap-2 p-2 bg-emerald-100 rounded-lg mb-3">
                <span className="material-symbols-outlined text-[#006c49] text-sm">info</span>
                <p className="text-xs text-[#005236]">Al aprobar, la oferta pasará al funcionario para que cree la ficha en Sofía Plus.</p>
              </div>
            </div>
            <button 
              onClick={handleAprobar}
              disabled={enviando}
              className={`w-full bg-[#006c49] text-white font-bold py-2.5 rounded-lg hover:bg-[#004a2b] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60`}
            >
              <span className="material-symbols-outlined text-sm">done_all</span>
              {enviando ? 'Procesando...' : 'Aprobar solicitud'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RevisarSolicitud;