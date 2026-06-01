import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatLocalDate } from '../utils/dateUtils';

const MisOfertas = () => {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);
  const [inscritos, setInscritos] = useState([]);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(null);

  // Mapa de colores para estados generales
  const estadosConfig = {
    'borrador': { color: '#95a5a6', bg: '#f1f2f6', label: 'Borrador', icon: 'draft' },
    'pendiente': { color: '#f39c12', bg: '#fff3e0', label: 'Pendiente', icon: 'pending_actions' },
    'rechazada': { color: '#e74c3c', bg: '#fdecea', label: 'Rechazada', icon: 'cancel' },
    'aprobada': { color: '#27ae60', bg: '#e8f8f5', label: 'Aprobada', icon: 'check_circle' },
    'ficha_creada': { color: '#2980b9', bg: '#eaf2f8', label: 'Ficha Creada', icon: 'description' },
    'con_inscritos': { color: '#8e44ad', bg: '#f4ecf7', label: 'Con Inscritos', icon: 'group' },
    'completada': { color: '#2c3e50', bg: '#ecf0f1', label: 'Completada', icon: 'task_alt' }
  };

  // Mapa de colores para estado administrativo
  // Mapa de colores para estado administrativo - ACTUALIZADO
  const estadoAdministrativoConfig = {
    'lista_espera': { color: '#3498db', bg: '#e8f4fd', label: 'Lista de espera', icon: 'hourglass_empty' },
    'proceso_creacion': { color: '#f39c12', bg: '#fff3e0', label: 'Proceso de creación', icon: 'construction' },
    'creada': { color: '#27ae60', bg: '#e8f8f5', label: 'Creada', icon: 'check_circle' },
    'matriculados': { color: '#8e44ad', bg: '#f4ecf7', label: 'Matriculados', icon: 'group' },
    'revision': { color: '#e74c3c', bg: '#fdecea', label: 'En revisión', icon: 'refresh' },
    // ✅ NUEVOS ESTADOS
    'ficha_proceso_creacion': { color: '#f39c12', bg: '#fff3e0', label: 'Ficha en proceso de creación', icon: 'construction' },
    'ficha_creada': { color: '#3498db', bg: '#e8f4fd', label: 'Ficha creada', icon: 'check_circle' },
    'validacion_instructor': { color: '#8e44ad', bg: '#f4ecf7', label: 'Validación por instructor', icon: 'refresh' }
  };

  useEffect(() => {
    cargarOfertas();

    // Recargar cuando el usuario vuelve a esta pestaña (p. ej. después de que un funcionario cambie el estado)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        cargarOfertas();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Polling cada 30 segundos para reflejar cambios de estado en tiempo real
    const interval = setInterval(cargarOfertas, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(interval);
    };
  }, []);

  const cargarOfertas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ofertas/mis-ofertas');
      console.log('Ofertas cargadas:', response.data);
      setOfertas(response.data.data || []);
    } catch (error) {
      console.error('Error cargando ofertas:', error);
      setError('Error al cargar las ofertas');
    } finally {
      setLoading(false);
    }
  };

  const cargarInscritos = async (ofertaId) => {
    try {
      const response = await api.get(`/inscripciones/oferta/${ofertaId}`);
      setInscritos(response.data.data || []);
    } catch (error) {
      console.error('Error cargando inscritos:', error);
      setInscritos([]);
    }
  };

 const verDetalle = async (oferta) => {
  setCargandoDetalle(true);
  setMostrarModalDetalle(true);
  try {
    // Recargar datos frescos de la oferta con TODOS los populate necesarios
    const response = await api.get(`/ofertas/${oferta._id}`);
    const ofertaActualizada = response.data.data || oferta;
    
    console.log('📋 Oferta cargada para detalle:', ofertaActualizada);
    console.log('📋 Estado:', ofertaActualizada.estado);
    console.log('📋 Estado Administrativo:', ofertaActualizada.estado_administrativo);
    
    setOfertaSeleccionada(ofertaActualizada);
    
    // Actualizar también en la lista local
    setOfertas(prev => prev.map(o => o._id === oferta._id ? ofertaActualizada : o));
  } catch (error) {
    console.error('Error recargando oferta:', error);
    setOfertaSeleccionada(oferta);
  }
  await cargarInscritos(oferta._id);
  setCargandoDetalle(false);
};

  const crearNuevaOferta = () => {
    window.location.href = '/dashboard';
  };

  const irASolicitarOferta = () => {
    window.location.href = '/solicitar-oferta';
  };

  const formatearFecha = (fecha) => formatLocalDate(fecha);

  const getComentarioRechazo = (oferta) => {
    if (oferta.comentario_rechazo) {
      return oferta.comentario_rechazo;
    }
    return null;
  };

  // Estadísticas
  const totalOfertas = ofertas.length;
  const pendientes = ofertas.filter(o => o.estado?.codigo === 'pendiente').length;
  const aprobadas = ofertas.filter(o => o.estado?.codigo === 'aprobada').length;
  const rechazadas = ofertas.filter(o => o.estado?.codigo === 'rechazada').length;
  const conCupos = ofertas.filter(o => (o.cupos_disponibles || 0) > 0).length;

  // Filtrar ofertas
  const ofertasFiltradas = ofertas.filter(oferta => {
    const matchSearch = searchTerm === '' || 
      (oferta.programa_formacion?.nombre_programa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (oferta.programa_formacion?.codigo || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchEstado = filterEstado === '' || oferta.estado?.codigo === filterEstado;
    return matchSearch && matchEstado;
  });

  const calcularPorcentajeCupos = (ocupados, total) => {
    if (!total || total === 0) return 0;
    return Math.round((ocupados / total) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006c49] mx-auto mb-4"></div>
          <p className="text-[#45474c]">Cargando ofertas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#006c49] mb-2">
            <span className="material-symbols-outlined text-xl">content_paste</span>
            <span className="text-xs font-medium tracking-wider">GESTIÓN ACADÉMICA</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-[#091426]">Mis Ofertas</h1>
          <p className="text-[#45474c] text-base mt-1">Administra y supervisa tus procesos de oferta</p>
        </div>
        <button 
          onClick={crearNuevaOferta}
          className="flex items-center gap-2 bg-[#006c49] text-white px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95 text-sm font-medium"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          Crear Nueva Oferta
        </button>
      </div>

      {/* Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#c5c6cd]/30 flex items-center gap-4">
          <div className="bg-[#006c49]/10 p-3 rounded-lg text-[#006c49]">
            <span className="material-symbols-outlined text-2xl">list_alt</span>
          </div>
          <div>
            <p className="text-[#45474c] text-xs font-medium">Total Ofertas</p>
            <p className="text-2xl font-semibold text-[#091426]">{totalOfertas}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#c5c6cd]/30 flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
            <span className="material-symbols-outlined text-2xl">pending_actions</span>
          </div>
          <div>
            <p className="text-[#45474c] text-xs font-medium">Pendientes</p>
            <p className="text-2xl font-semibold text-[#091426]">{pendientes}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#c5c6cd]/30 flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-lg text-[#006c49]">
            <span className="material-symbols-outlined text-2xl">check_circle</span>
          </div>
          <div>
            <p className="text-[#45474c] text-xs font-medium">Aprobadas</p>
            <p className="text-2xl font-semibold text-[#091426]">{aprobadas}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#c5c6cd]/30 flex items-center gap-4">
          <div className="bg-red-100 p-3 rounded-lg text-red-600">
            <span className="material-symbols-outlined text-2xl">cancel</span>
          </div>
          <div>
            <p className="text-[#45474c] text-xs font-medium">Rechazadas</p>
            <p className="text-2xl font-semibold text-[#091426]">{rechazadas}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#c5c6cd]/30 flex items-center gap-4">
          <div className="bg-[#1e293b] p-3 rounded-lg text-[#8590a6]">
            <span className="material-symbols-outlined text-2xl">group</span>
          </div>
          <div>
            <p className="text-[#45474c] text-xs font-medium">Con Cupos</p>
            <p className="text-2xl font-semibold text-[#091426]">{conCupos}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-[#ffdad6] text-[#93000a] p-4 rounded-lg mb-6 flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {ofertas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-[#c5c6cd]/30 overflow-hidden">
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-24 h-24 mb-6 rounded-full bg-[#eff4ff] flex items-center justify-center text-[#c5c6cd]">
              <span className="material-symbols-outlined text-5xl">inventory_2</span>
            </div>
            <h3 className="text-2xl font-semibold text-[#091426] mb-2">No tienes ofertas registradas</h3>
            <p className="text-[#45474c] text-base max-w-md mb-6">Comienza creando tu primera oferta educativa para este periodo académico. El proceso es guiado y sencillo.</p>
            <button onClick={crearNuevaOferta} className="bg-[#006c49] text-white px-8 py-3 rounded-lg shadow-sm hover:shadow-lg transition-all flex items-center gap-3 font-semibold">
              <span className="material-symbols-outlined">add</span> Crear mi primera oferta
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-[#c5c6cd]/30 overflow-hidden">
            {/* Filters Bar */}
            <div className="p-5 border-b border-[#c5c6cd]/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#f8f9ff]">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#75777d] text-base">search</span>
                  <input
                    type="text"
                    placeholder="Buscar por programa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-3 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none text-sm w-full sm:w-64 transition-all"
                  />
                </div>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="px-3 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none text-sm bg-white cursor-pointer"
                >
                  <option value="">Todos los estados</option>
                  {Object.entries(estadosConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 text-[#45474c] text-xs font-medium">
                <span>Mostrando {ofertasFiltradas.length} de {totalOfertas}</span>
              </div>
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#eff4ff] border-b border-[#c5c6cd]/30">
                  <tr>
                    <th className="px-5 py-3 text-xs font-medium text-[#001334] uppercase tracking-wider">Programa</th>
                    <th className="px-5 py-3 text-xs font-medium text-[#001334] uppercase tracking-wider">Tipo</th>
                    <th className="px-5 py-3 text-xs font-medium text-[#001334] uppercase tracking-wider">Fechas</th>
                    <th className="px-5 py-3 text-xs font-medium text-[#001334] uppercase tracking-wider">Cupos</th>
                    <th className="px-5 py-3 text-xs font-medium text-[#001334] uppercase tracking-wider">Estado</th>
                    <th className="px-5 py-3 text-xs font-medium text-[#001334] uppercase tracking-wider">Estado Administración Educativa</th>
                    <th className="px-5 py-3 text-xs font-medium text-[#001334] uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c5c6cd]/20">
                  {ofertasFiltradas.map((oferta) => {
                    const estado = oferta.estado?.codigo || 'borrador';
                    const config = estadosConfig[estado] || estadosConfig.borrador;
                    const historialAdmin = oferta.historial_administrativo || [];
                    const estadoAdmin = historialAdmin.length > 0
                      ? historialAdmin[historialAdmin.length - 1].estado
                      : 'lista_espera';
                    const configAdmin = estadoAdministrativoConfig[estadoAdmin] || { color: '#3498db', bg: '#e8f4fd', label: estadoAdmin, icon: 'hourglass_empty' };
                    const ocupados = (oferta.cupo_maximo || 0) - (oferta.cupos_disponibles || 0);
                    const totalCupos = oferta.cupo_maximo || 0;
                    const porcentaje = calcularPorcentajeCupos(ocupados, totalCupos);
                    const comentarioRechazo = getComentarioRechazo(oferta);
                    
                    return (
                      <tr key={oferta._id} className={`hover:bg-[#f8f9ff] transition-all group hover:translate-x-1 duration-200 ${estado === 'rechazada' ? 'bg-red-50/30' : ''}`}>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="text-base font-semibold text-[#091426]">{oferta.programa_formacion?.nombre_programa || 'N/A'}</span>
                            <span className="text-xs text-[#75777d]">Cod: {oferta.programa_formacion?.codigo || 'N/A'}</span>
                          </div>
                         </td>
                        <td className="px-5 py-4">
                          <span className={`px-2 py-1 text-xs rounded font-medium ${oferta.es_campesena ? 'bg-orange-100 text-orange-800' : 'bg-[#6cf8bb]/30 text-[#005236]'}`}>
                            {oferta.es_campesena ? 'Campesena' : 'Regular'}
                          </span>
                         </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col text-sm text-[#45474c]">
                            <span>{formatearFecha(oferta.fechas?.inicio)}</span>
                            <span className="text-xs text-[#75777d] italic">Fin: {formatearFecha(oferta.fechas?.fin)}</span>
                          </div>
                         </td>
                        <td className="px-5 py-4 w-48">
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span className={porcentaje >= 80 ? 'text-[#006c49] font-bold' : porcentaje >= 50 ? 'text-orange-600' : 'text-[#45474c]'}>
                                {ocupados}/{totalCupos}
                              </span>
                              <span className="text-[#45474c]">{porcentaje}%</span>
                            </div>
                            <div className="w-full bg-[#e5eeff] h-2 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${porcentaje >= 80 ? 'bg-[#006c49]' : porcentaje >= 50 ? 'bg-orange-500' : 'bg-[#1e293b]'}`} style={{ width: `${porcentaje}%` }}></div>
                            </div>
                          </div>
                         </td>
                        <td className="px-5 py-4">
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg w-fit`} style={{ backgroundColor: config.bg }}>
                            <span className={`w-2 h-2 rounded-full animate-pulse`} style={{ backgroundColor: config.color }}></span>
                            <span className="text-xs font-medium" style={{ color: config.color }}>{config.label}</span>
                          </div>
                         </td>
                        <td className="px-5 py-4">
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-lg w-fit`} style={{ backgroundColor: configAdmin.bg }}>
                            <span className={`w-2 h-2 rounded-full animate-pulse`} style={{ backgroundColor: configAdmin.color }}></span>
                            <span className="text-xs font-medium" style={{ color: configAdmin.color }}>{configAdmin.label}</span>
                          </div>
                         </td>
                        <td className="px-5 py-4 text-right">
                          <div className="relative flex items-center justify-end">
                            <button 
                              onClick={() => verDetalle(oferta)} 
                              onMouseEnter={() => comentarioRechazo && setTooltipVisible(oferta._id)}
                              onMouseLeave={() => setTooltipVisible(null)}
                              className="p-2 text-[#006c49] hover:bg-[#006c49]/10 rounded-lg transition-all group-hover:scale-110 active:scale-90 relative"
                              title="Ver detalle completo de la oferta"
                            >
                              <span className="material-symbols-outlined">visibility</span>
                              {comentarioRechazo && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
                              )}
                            </button>
                            
                            {/* Tooltip con el motivo del rechazo */}
                            {tooltipVisible === oferta._id && comentarioRechazo && (
                              <div className="absolute z-50 top-full right-0 mt-2 w-80 bg-red-600 text-white rounded-lg shadow-xl animate-fade-in-up overflow-hidden">
                                <div className="p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="material-symbols-outlined text-sm">error</span>
                                    <span className="text-xs font-bold uppercase tracking-wider">Motivo del rechazo</span>
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">{comentarioRechazo}</p>
                                </div>
                                <div className="absolute -top-2 right-4 w-3 h-3 bg-red-600 rotate-45"></div>
                              </div>
                            )}
                          </div>
                         </td>
                       </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {ofertasFiltradas.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#45474c]">No se encontraron ofertas con los filtros seleccionados.</p>
              </div>
            )}
          </div>

          {/* Botón flotante para ir a Solicitar Oferta */}
          {rechazadas > 0 && (
            <div className="fixed bottom-8 right-8 z-40">
             
            </div>
          )}
        </>
      )}

      {/* Modal de Detalle de Oferta - con motivo del rechazo destacado */}
      {mostrarModalDetalle && ofertaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className={`sticky top-0 z-10 p-5 border-b flex justify-between items-start ${ofertaSeleccionada.estado?.codigo === 'rechazada' ? 'bg-red-50' : 'bg-[#eff4ff]'}`}>
              <div>
                <h2 className="text-xl font-bold text-[#091426]">
                  Detalle de la Oferta
                </h2>
                <p className="text-sm text-[#45474c]">
                  {ofertaSeleccionada.programa_formacion?.nombre_programa || 'Programa sin nombre'}
                </p>
              </div>
              <button 
                onClick={() => setMostrarModalDetalle(false)}
                className="p-2 hover:bg-black/10 rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {cargandoDetalle ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#006c49]"></div>
              </div>
            ) : (
              <div className="p-5 space-y-6">
                {/* Motivo del rechazo - DESTACADO en la parte superior */}
                {ofertaSeleccionada.comentario_rechazo && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-red-600">cancel</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-red-800 text-base mb-2 flex items-center gap-2">
                          ⚠️ Motivo del rechazo
                          <span className="text-xs bg-red-200 text-red-800 px-2 py-0.5 rounded-full">Importante</span>
                        </h3>
                        <div className="bg-white rounded-lg p-3 border border-red-200">
                          <p className="text-red-700 text-sm whitespace-pre-wrap">{ofertaSeleccionada.comentario_rechazo}</p>
                        </div>
                        <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">info</span>
                          Debes corregir estos aspectos antes de reenviar la oferta
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Información General */}
                <div>
                  <h3 className="text-lg font-semibold text-[#006c49] mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined">info</span>
                    Información General
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-[#f8f9ff] rounded-lg">
                      <p className="text-xs text-[#75777d]">Código del Programa</p>
                      <p className="font-semibold">{ofertaSeleccionada.programa_formacion?.codigo || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-[#f8f9ff] rounded-lg">
                      <p className="text-xs text-[#75777d]">Tipo de Formación</p>
                      <p className="font-semibold">{ofertaSeleccionada.es_campesena ? 'Campesena' : 'Regular'}</p>
                    </div>
                    <div className="p-3 bg-[#f8f9ff] rounded-lg">
                      <p className="text-xs text-[#75777d]">Fecha de Inicio</p>
                      <p className="font-semibold">{formatearFecha(ofertaSeleccionada.fechas?.inicio)}</p>
                    </div>
                    <div className="p-3 bg-[#f8f9ff] rounded-lg">
                      <p className="text-xs text-[#75777d]">Fecha de Fin</p>
                      <p className="font-semibold">{formatearFecha(ofertaSeleccionada.fechas?.fin)}</p>
                    </div>
                    <div className="p-3 bg-[#f8f9ff] rounded-lg">
                      <p className="text-xs text-[#75777d]">Municipio</p>
                      <p className="font-semibold">{ofertaSeleccionada.ubicacion?.municipio?.nombre || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-[#f8f9ff] rounded-lg">
                      <p className="text-xs text-[#75777d]">Dirección</p>
                      <p className="font-semibold">{ofertaSeleccionada.ubicacion?.direccion || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Cupos e Inscritos */}
                <div>
                  <h3 className="text-lg font-semibold text-[#006c49] mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined">groups</span>
                    Cupos e Inscritos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-700">{ofertaSeleccionada.cupo_maximo || 0}</p>
                      <p className="text-xs text-blue-600">Cupos Totales</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-700">{inscritos.length}</p>
                      <p className="text-xs text-green-600">Inscritos</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-orange-700">{ofertaSeleccionada.cupos_disponibles || 0}</p>
                      <p className="text-xs text-orange-600">Cupos Disponibles</p>
                    </div>
                  </div>
                </div>

                {/* Lista de Inscritos */}
                {inscritos.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#006c49] mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined">list_alt</span>
                      Lista de Aprendices Inscritos ({inscritos.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead className="bg-[#eff4ff]">
                          <tr>
                            <th className="px-3 py-2 text-left">Nombres</th>
                            <th className="px-3 py-2 text-left">Documento</th>
                            <th className="px-3 py-2 text-left">Correo</th>
                            <th className="px-3 py-2 text-left">Teléfono</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {inscritos.map((inscrito) => (
                            <tr key={inscrito._id} className="hover:bg-[#f8f9ff]">
                              <td className="px-3 py-2">{inscrito.nombres} {inscrito.apellidos}</td>
                              <td className="px-3 py-2">{inscrito.numero_documento}</td>
                              <td className="px-3 py-2">{inscrito.correo}</td>
                              <td className="px-3 py-2">{inscrito.telefono}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Estado Actual */}
                <div>
                  <h3 className="text-lg font-semibold text-[#006c49] mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined">flag</span>
                    Estado Actual
                  </h3>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      ofertaSeleccionada.estado?.codigo === 'rechazada' ? 'bg-red-100 text-red-700' :
                      ofertaSeleccionada.estado?.codigo === 'pendiente' ? 'bg-orange-100 text-orange-700' :
                      ofertaSeleccionada.estado?.codigo === 'aprobada' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {ofertaSeleccionada.estado?.nombre || ofertaSeleccionada.estado?.codigo || 'Aprobada'}
                    </span>
                  </div>
                </div>

                {/* Estado Administrativo (Ficha) */}
                {(() => { const h = ofertaSeleccionada.historial_administrativo || []; return h.length > 0; })() && (
                  <div>
                    <h3 className="text-lg font-semibold text-[#006c49] mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined">admin_panel_settings</span>
                      Estado Administración Educativa
                    </h3>
                    {(() => {
                      const historialAdminModal = ofertaSeleccionada.historial_administrativo || [];
                      const codigoAdmin = historialAdminModal.length > 0
                        ? historialAdminModal[historialAdminModal.length - 1].estado
                        : null;
                      const configAdmin = estadoAdministrativoConfig[codigoAdmin];
                      const iconMap = {
                        'lista_espera': 'hourglass_empty',
                        'proceso_creacion': 'construction',
                        'creada': 'check_circle',
                        'matriculados': 'group',
                        'en_revision': 'refresh',
                        'ficha_proceso_creacion': 'construction',
                        'ficha_creada': 'check_circle',
                        'validacion_instructor': 'refresh'
                      };
                      return configAdmin ? (
                        <div
                          className="flex items-center gap-3 px-4 py-3 rounded-lg w-fit"
                          style={{ backgroundColor: configAdmin.bg }}
                        >
                          <span
                            className="material-symbols-outlined text-xl"
                            style={{ color: configAdmin.color }}
                          >
                            {iconMap[codigoAdmin] || 'info'}
                          </span>
                          <div>
                            <p className="text-sm font-bold" style={{ color: configAdmin.color }}>
                              {ofertaSeleccionada.estado_administrativo?.nombre || configAdmin.label}
                            </p>
                            {ofertaSeleccionada.estado_administrativo?.descripcion && (
                              <p className="text-xs mt-0.5" style={{ color: configAdmin.color, opacity: 0.8 }}>
                                {ofertaSeleccionada.estado_administrativo.descripcion}
                              </p>
                            )}
                          </div>
                          <span
                            className="w-2.5 h-2.5 rounded-full animate-pulse ml-2"
                            style={{ backgroundColor: configAdmin.color }}
                          ></span>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="sticky bottom-0 bg-[#f8f9ff] border-t p-4 flex justify-end">
              <button
                onClick={() => setMostrarModalDetalle(false)}
                className="px-4 py-2 bg-[#006c49] text-white rounded-lg hover:bg-[#004a2b] transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MisOfertas;