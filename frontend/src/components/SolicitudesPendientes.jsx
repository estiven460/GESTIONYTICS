import React, { useState, useEffect } from 'react';
import api from '../services/api';
import RevisarSolicitud from './RevisarSolicitud';

const SolicitudesPendientes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [orden, setOrden] = useState('reciente');

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/solicitudes/pendientes');
      setSolicitudes(response.data.data || []);
    } catch (error) {
      console.error('Error cargando solicitudes:', error);
      setError('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  };

  const handleSolicitudActualizada = () => {
    setSolicitudSeleccionada(null);
    cargarSolicitudes();
  };

  // Filtrar solicitudes por búsqueda
  const solicitudesFiltradas = solicitudes.filter(solicitud => {
    const programa = solicitud.oferta_id?.programa_formacion?.nombre_programa || '';
    const instructor = solicitud.instructor_id?.nombre || '';
    const busqueda = filtroBusqueda.toLowerCase();
    return programa.toLowerCase().includes(busqueda) || instructor.toLowerCase().includes(busqueda);
  });

  // Ordenar solicitudes
  const solicitudesOrdenadas = [...solicitudesFiltradas].sort((a, b) => {
    if (orden === 'reciente') {
      return new Date(b.fecha_solicitud) - new Date(a.fecha_solicitud);
    }
    if (orden === 'programa') {
      const nombreA = a.oferta_id?.programa_formacion?.nombre_programa || '';
      const nombreB = b.oferta_id?.programa_formacion?.nombre_programa || '';
      return nombreA.localeCompare(nombreB);
    }
    return 0;
  });

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006c49] mx-auto mb-4"></div>
          <p className="text-[#45474c]">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-semibold text-[#0b1c30] mb-2">Solicitudes de Validación Pendientes</h1>
          <p className="text-base text-[#45474c]">Administra y revisa las propuestas de validación de programas enviadas por el equipo de instructores.</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-[#ffdad6] text-[#93000a] flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#45474c]">search</span>
          <input
            type="text"
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-[#eff4ff] border border-[#c5c6cd] rounded-xl focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none transition-all text-sm text-[#0b1c30]"
            placeholder="Filtrar por programa o instructor..."
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#45474c]">Ordenar por:</span>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className="bg-[#eff4ff] border border-[#c5c6cd] rounded-lg px-3 py-2 text-sm text-[#0b1c30] outline-none focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] transition-all"
          >
            <option value="reciente">Más recientes</option>
            <option value="programa">Nombre programa</option>
          </select>
        </div>
      </div>

      {/* Grid de Solicitudes */}
      {solicitudesOrdenadas.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center py-16 bg-[#eff4ff] rounded-3xl border-2 border-dashed border-[#c5c6cd]">
          <div className="w-24 h-24 bg-[#dce9ff] rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-5xl text-[#45474c]">inbox</span>
          </div>
          <h3 className="text-2xl font-semibold text-[#0b1c30] mb-2">No hay solicitudes pendientes</h3>
          <p className="text-base text-[#45474c] max-w-md">
            ¡Buen trabajo! Has revisado todas las validaciones pendientes. Recibirás una notificación cuando un instructor envíe una nueva.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {solicitudesOrdenadas.map((solicitud) => {
            const oferta = solicitud.oferta_id;
            const programa = oferta?.programa_formacion;
            const instructor = solicitud.instructor_id;
            const modalidad = oferta?.modalidad?.nombre || 'N/A';
            const tipoOferta = oferta?.tipo_oferta?.nombre || 'N/A';

            return (
              <div key={solicitud._id} className="bg-white rounded-xl p-5 border border-[#c5c6cd]/20 flex flex-col shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 duration-200">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-medium text-[#45474c]">{formatearFecha(solicitud.fecha_solicitud)}</span>
                </div>

                <h3 className="text-xl font-semibold text-[#006c49] mb-3">{programa?.nombre_programa || 'Programa sin nombre'}</h3>

                <div className="grid grid-cols-2 gap-y-2 gap-x-3 mb-4">
                  <p className="text-sm text-[#45474c] flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">qr_code</span>
                    {programa?.codigo || 'N/A'}
                  </p>
                  <p className="text-sm text-[#45474c] flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">tag</span>
                    Ficha: {oferta?.codigo_ficha || 'N/A'}
                  </p>
                  <p className="text-sm text-[#45474c] flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">devices</span>
                    {modalidad}
                  </p>
                  <p className="text-sm text-[#45474c] flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">inventory</span>
                    {tipoOferta}
                  </p>
                </div>

                <div className="space-y-4 flex-grow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#eff4ff] flex items-center justify-center border border-[#c5c6cd]">
                      <span className="material-symbols-outlined text-[#006c49]">person</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0b1c30]">{instructor?.nombre} {instructor?.apellido}</p>
                      <p className="text-xs text-[#45474c]">{instructor?.correoElectronico}</p>
                    </div>
                  </div>

                  {solicitud.mensaje && (
                    <div className="bg-[#eff4ff] p-3 rounded-lg border-l-4 border-[#006c49]">
                      <p className="text-sm text-[#0b1c30] italic leading-relaxed">"{solicitud.mensaje}"</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSolicitudSeleccionada(solicitud._id)}
                  className="mt-5 w-full bg-[#091426] text-white text-sm font-medium py-3 rounded-lg hover:bg-[#091426]/90 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Revisar Solicitud
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para revisar solicitud */}
      {solicitudSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-xl">
            <RevisarSolicitud
              solicitudId={solicitudSeleccionada}
              onClose={() => setSolicitudSeleccionada(null)}
              onActualizar={handleSolicitudActualizada}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SolicitudesPendientes;