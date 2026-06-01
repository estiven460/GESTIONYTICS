import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatLocalDate } from '../utils/dateUtils';

const LinksInscripcion = () => {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(null);
  const [usuario, setUsuario] = useState(null);
  const [mostrarModalCupos, setMostrarModalCupos] = useState(false);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);
  const [nuevoCupo, setNuevoCupo] = useState('');
  const [actualizando, setActualizando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUsuario(user);
    cargarMisOfertas();
  }, []);

  const cargarMisOfertas = async () => {
    try {
      const response = await api.get('/ofertas/mis-ofertas');
      const todasOfertas = response.data.data || [];
      // ✅ Filtrar: solo mostrar ofertas pendientes y rechazadas (excluir aprobadas)
      const ofertasFiltradas = todasOfertas.filter(o => 
        o.estado?.codigo === 'pendiente' || o.estado?.codigo === 'rechazada'
      );
      setOfertas(ofertasFiltradas);
    } catch (error) {
      console.error('Error cargando mis ofertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const copiarLink = (link) => {
    const urlCompleta = `http://localhost:3000${link}`;
    navigator.clipboard.writeText(urlCompleta);
    setCopiado(link);
    setTimeout(() => setCopiado(null), 2000);
  };

  const abrirLink = (link) => {
    window.open(`http://localhost:3000${link}`, '_blank');
  };

  const descargarPDF = async (ofertaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/ofertas/${ofertaId}/pdf`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ficha-${ofertaId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error al descargar el PDF');
    }
  };

  const crearNuevaOferta = () => {
    window.location.href = '/dashboard';
  };

  // Función para abrir el modal de habilitar más cupos
  const abrirModalHabilitarCupos = (oferta) => {
    setOfertaSeleccionada(oferta);
    setNuevoCupo(oferta.cupo_maximo || 0);
    setMostrarModalCupos(true);
  };

  // Función para habilitar más cupos
  const habilitarMasCupos = async () => {
    if (!ofertaSeleccionada) return;
    
    const nuevoCupoMaximo = parseInt(nuevoCupo);
    const inscritosActuales = (ofertaSeleccionada.cupo_maximo || 0) - (ofertaSeleccionada.cupos_disponibles || 0);
    
    if (nuevoCupoMaximo <= inscritosActuales) {
      setMensajeError(`El nuevo cupo máximo (${nuevoCupoMaximo}) debe ser mayor a los inscritos actuales (${inscritosActuales})`);
      setTimeout(() => setMensajeError(''), 3000);
      return;
    }
    
    if (nuevoCupoMaximo <= ofertaSeleccionada.cupo_maximo) {
      setMensajeError(`El nuevo cupo debe ser mayor al actual (${ofertaSeleccionada.cupo_maximo})`);
      setTimeout(() => setMensajeError(''), 3000);
      return;
    }
    
    setActualizando(true);
    setMensajeError('');
    
    try {
      const nuevosCuposDisponibles = nuevoCupoMaximo - inscritosActuales;
      
      const response = await api.put(`/ofertas/${ofertaSeleccionada._id}`, {
        cupo_maximo: nuevoCupoMaximo,
        cupos_disponibles: nuevosCuposDisponibles
      });
      
      // Actualizar la oferta en la lista
      setOfertas(ofertas.map(o => 
        o._id === ofertaSeleccionada._id ? response.data.data : o
      ));
      
      setMensajeExito(`✅ Cupos actualizados: ahora hay ${nuevosCuposDisponibles} cupos disponibles para nuevos aspirantes`);
      setTimeout(() => setMensajeExito(''), 4000);
      
      // Cerrar modal
      setMostrarModalCupos(false);
      setOfertaSeleccionada(null);
      
      // Recargar ofertas para asegurar datos actualizados
      setTimeout(() => cargarMisOfertas(), 1000);
      
    } catch (error) {
      console.error('Error actualizando cupos:', error);
      setMensajeError(error.response?.data?.message || 'Error al actualizar los cupos');
      setTimeout(() => setMensajeError(''), 3000);
    } finally {
      setActualizando(false);
    }
  };

  // Redirigir a Solicitar Oferta para reenviar
  const irASolicitarOferta = (ofertaId) => {
    localStorage.setItem('ofertaParaReenviar', ofertaId);
    window.location.href = '/solicitar-oferta';
  };

  const getComentarioRechazo = (oferta) => {
    return oferta.comentario_rechazo || null;
  };

  // Separar ofertas rechazadas y pendientes
  const ofertasRechazadas = ofertas.filter(o => o.estado?.codigo === 'rechazada');
  const ofertasPendientes = ofertas.filter(o => o.estado?.codigo === 'pendiente');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006c49] mx-auto mb-4"></div>
          <p className="text-[#45474c]">Cargando mis ofertas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto">
      {/* Mensajes de éxito y error */}
      {mensajeExito && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 bg-[#6cf8bb]/30 border-[#005236] text-[#005236] animate-in slide-in-from-right duration-300">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-medium">{mensajeExito}</span>
          <button onClick={() => setMensajeExito('')} className="ml-auto material-symbols-outlined text-sm opacity-60 hover:opacity-100">close</button>
        </div>
      )}
      
      {mensajeError && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 bg-[#ffdad6] border-[#ba1a1a] text-[#93000a] animate-in slide-in-from-right duration-300">
          <span className="material-symbols-outlined">error</span>
          <span className="font-medium">{mensajeError}</span>
          <button onClick={() => setMensajeError('')} className="ml-auto material-symbols-outlined text-sm opacity-60 hover:opacity-100">close</button>
        </div>
      )}

      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-[#091426] mb-4">
          🔗 Mis Ofertas - Links de Inscripción
        </h1>
        <div className="bg-[#eff4ff] border border-[#c5c6cd] rounded-lg p-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#006c49]">account_circle</span>
            <span className="text-base text-[#0b1c30]">
              Mostrando ofertas de: <strong className="text-[#0b1c30]">{usuario?.nombreUsuario || usuario?.nombre || 'Usuario'}</strong>
            </span>
          </div>
          <div className="flex gap-2">
            {ofertasRechazadas.length > 0 && (
              <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">warning</span>
                {ofertasRechazadas.length} oferta(s) rechazada(s)
              </div>
            )}
            {ofertasPendientes.length > 0 && (
              <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">pending_actions</span>
                {ofertasPendientes.length} oferta(s) pendiente(s)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {ofertas.length === 0 && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-[#dce9ff] rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-5xl text-[#45474c]">folder_off</span>
          </div>
          <h3 className="text-2xl font-semibold text-[#091426] mb-2">No tienes ofertas disponibles</h3>
          <p className="text-base text-[#45474c] mb-8 max-w-md">
            Solo se muestran ofertas en estado <strong>Pendiente</strong> o <strong>Rechazada</strong>.
            Las ofertas aprobadas no aparecen aquí.
          </p>
          <button 
            onClick={crearNuevaOferta}
            className="bg-[#006c49] text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95"
          >
            Crear nueva oferta
          </button>
        </div>
      )}

      {/* Sección de Ofertas Rechazadas */}
      {ofertasRechazadas.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-red-600">cancel</span>
            <h2 className="text-xl font-bold text-[#091426]">Ofertas Rechazadas - Requieren acción</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {ofertasRechazadas.map((oferta) => {
              const inscritosActuales = (oferta.cupo_maximo || 0) - (oferta.cupos_disponibles || 0);
              const comentarioRechazo = getComentarioRechazo(oferta);
              
              return (
                <div key={oferta._id} className="bg-white rounded-xl border-2 border-red-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className="p-5 bg-red-50 border-b border-red-200 flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-[#091426] mb-1">
                        {oferta.programa_formacion?.nombre_programa || 'Programa sin nombre'}
                      </h3>
                      <span className="text-xs font-medium bg-red-200 text-red-800 px-2 py-0.5 rounded">
                        ID: {oferta.programa_formacion?.codigo || 'N/A'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-[#45474c] uppercase tracking-wider mb-1">Estado</span>
                      <span className="bg-red-600 text-white font-bold px-3 py-1 rounded-full text-sm">
                        Rechazada
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5 space-y-4">
                    {/* Motivo del rechazo */}
                    {comentarioRechazo && (
                      <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
                        <p className="text-xs font-bold text-red-700 mb-1">Motivo del rechazo:</p>
                        <p className="text-sm text-red-600">{comentarioRechazo}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#45474c] mb-1">Fechas</label>
                        <p className="text-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">calendar_today</span>
                          {formatLocalDate(oferta.fechas?.inicio)} - {formatLocalDate(oferta.fechas?.fin)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-[#45474c] mb-1">Municipio</label>
                        <p className="text-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {oferta.ubicacion?.municipio?.nombre || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-[#45474c] mb-1">Cupos Actuales</label>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-lg font-bold text-[#091426]">{oferta.cupos_disponibles || 0}</span>
                          <span className="text-sm text-[#45474c]"> / {oferta.cupo_maximo || 0} disponibles</span>
                        </div>
                        <span className="text-xs text-[#45474c]">{inscritosActuales} inscritos</span>
                      </div>
                      <div className="w-full bg-[#e5eeff] h-2 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${(inscritosActuales / (oferta.cupo_maximo || 1)) * 100}%` }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-[#45474c] mb-2 uppercase tracking-tight font-bold">Enlace de Registro</label>
                      <div className="bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg p-3 text-sm text-[#45474c] flex items-center overflow-hidden">
                        <span className="truncate">localhost:3000{oferta.link_inscripciones || '/inscribirse/error'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-[#eff4ff] border-t border-[#c5c6cd]">
                    <button 
                      onClick={() => abrirModalHabilitarCupos(oferta)}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all active:scale-95 mb-2"
                    >
                      <span className="material-symbols-outlined">group_add</span>
                      Habilitar más aspirantes
                    </button>
                    
                    <button 
                      onClick={() => irASolicitarOferta(oferta._id)}
                      className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white font-medium py-2 rounded-lg hover:bg-orange-700 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">refresh</span>
                      Reenviar al Coordinador
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sección de Ofertas Pendientes */}
      {ofertasPendientes.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-4 mt-8">
            <span className="material-symbols-outlined text-orange-500">pending_actions</span>
            <h2 className="text-xl font-bold text-[#091426]">Ofertas Pendientes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {ofertasPendientes.map((oferta) => {
              const porcentajeCupos = ((oferta.cupos_disponibles || 0) / (oferta.cupo_maximo || 1)) * 100;
              const cuposColorClass = porcentajeCupos >= 80 ? 'bg-[#6cf8bb]/30 text-[#005236]' : 
                                      porcentajeCupos >= 50 ? 'bg-orange-100 text-orange-700' : 
                                      'bg-[#ffdad6] text-[#93000a]';
              
              return (
                <div key={oferta._id} className="bg-white rounded-xl border border-[#c5c6cd] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                  <div className="p-5 bg-orange-50/30 border-b border-[#c5c6cd] flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-[#091426] mb-1">
                        {oferta.programa_formacion?.nombre_programa || 'Programa sin nombre'}
                      </h3>
                      <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                        ID: {oferta.programa_formacion?.codigo || 'N/A'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-xs text-[#45474c] uppercase tracking-wider mb-1">Estado</span>
                      <span className="bg-orange-500 text-white font-bold px-3 py-1 rounded-full text-sm">
                        Pendiente
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-[#45474c] mb-1">Fechas</label>
                        <p className="text-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">calendar_today</span>
                          {formatLocalDate(oferta.fechas?.inicio)} - {formatLocalDate(oferta.fechas?.fin)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs text-[#45474c] mb-1">Municipio</label>
                        <p className="text-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          {oferta.ubicacion?.municipio?.nombre || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-[#45474c] mb-1">Cupos</label>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-lg font-bold text-[#091426]">{oferta.cupos_disponibles || 0}</span>
                          <span className="text-sm text-[#45474c]"> / {oferta.cupo_maximo || 0} disponibles</span>
                        </div>
                      </div>
                      <div className="w-full bg-[#e5eeff] h-2 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-orange-500 rounded-full" style={{ width: `${porcentajeCupos}%` }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-[#45474c] mb-1">Coordinador Asignado</label>
                      <p className="text-sm font-medium">{oferta.coordinador_asignado?.nombre || usuario?.coordinadorAsignado?.nombre || 'N/A'}</p>
                    </div>
                    
                    <div className="mt-3">
                      <label className="block text-xs text-[#45474c] mb-2 uppercase tracking-tight font-bold">Enlace de Registro</label>
                      <div className="bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg p-3 text-sm text-[#45474c] flex items-center overflow-hidden">
                        <span className="truncate">localhost:3000{oferta.link_inscripciones || '/inscribirse/error'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-[#eff4ff] border-t border-[#c5c6cd] grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => copiarLink(oferta.link_inscripciones)}
                      className={`flex items-center justify-center gap-2 font-medium py-2 rounded-lg transition-all active:scale-95 ${
                        copiado === oferta.link_inscripciones 
                          ? 'bg-[#006c49] text-white' 
                          : 'bg-[#bcc7de] text-[#111c2d] hover:bg-[#d8e3fb]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {copiado === oferta.link_inscripciones ? 'check' : 'content_copy'}
                      </span>
                      {copiado === oferta.link_inscripciones ? 'Copiado' : 'Copiar'}
                    </button>
                    <button 
                      onClick={() => abrirLink(oferta.link_inscripciones)}
                      className="flex items-center justify-center gap-2 bg-[#6cf8bb] text-[#005236] font-medium py-2 rounded-lg hover:bg-[#4edea3] transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">open_in_new</span>
                      Abrir
                    </button>
                    <button 
                      onClick={() => descargarPDF(oferta._id)}
                      className="flex items-center justify-center gap-2 border border-[#ba1a1a] text-[#ba1a1a] font-medium py-2 rounded-lg hover:bg-[#ba1a1a]/10 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                      PDF
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Modal para habilitar más cupos */}
      {mostrarModalCupos && ofertaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden animate-fade-in-up">
            <div className="bg-blue-600 p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined">group_add</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Habilitar más aspirantes</h2>
                  <p className="text-sm text-white/80">{ofertaSeleccionada.programa_formacion?.nombre_programa}</p>
                </div>
              </div>
              <button 
                onClick={() => setMostrarModalCupos(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-[#45474c]">Cupos actuales:</span>
                  <span className="font-bold">{ofertaSeleccionada.cupo_maximo}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-[#45474c]">Aspirantes inscritos:</span>
                  <span className="font-bold">{(ofertaSeleccionada.cupo_maximo || 0) - (ofertaSeleccionada.cupos_disponibles || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#45474c]">Cupos disponibles:</span>
                  <span className="font-bold text-blue-600">{ofertaSeleccionada.cupos_disponibles || 0}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#091426] mb-2">
                  Nuevo cupo máximo de aspirantes
                </label>
                <input
                  type="number"
                  value={nuevoCupo}
                  onChange={(e) => setNuevoCupo(e.target.value)}
                  min={(ofertaSeleccionada.cupo_maximo || 0) + 1}
                  className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <p className="text-xs text-[#75777d] mt-1">
                  Nuevos cupos disponibles: {parseInt(nuevoCupo) - ((ofertaSeleccionada.cupo_maximo || 0) - (ofertaSeleccionada.cupos_disponibles || 0))}
                </p>
              </div>

              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-yellow-600 text-sm">info</span>
                  <p className="text-xs text-yellow-800">
                    Después de habilitar más cupos, el enlace de inscripción seguirá funcionando. 
                    Luego podrás ir a "Reenviar al Coordinador" para solicitar la validación nuevamente.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 bg-[#f8f9ff] border-t border-[#c5c6cd]/30 flex justify-end gap-3">
              <button
                onClick={() => setMostrarModalCupos(false)}
                className="px-4 py-2 text-[#45474c] hover:bg-[#e5eeff] rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={habilitarMasCupos}
                disabled={actualizando}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {actualizando ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Actualizando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">check</span>
                    Habilitar Cupos
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinksInscripcion;