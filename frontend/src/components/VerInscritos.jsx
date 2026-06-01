import React, { useState, useEffect } from 'react';
import api from '../services/api';

const VerInscritos = () => {
  const [ofertas, setOfertas] = useState([]);
  const [inscritos, setInscritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [fusionando, setFusionando] = useState(false);

  useEffect(() => {
    cargarOfertas();
  }, []);

  const cargarOfertas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ofertas/mis-ofertas');
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
      setLoading(true);
      const response = await api.get(`/inscripciones/oferta/${ofertaId}`);
      setInscritos(response.data.data || []);
      const oferta = ofertas.find(o => o._id === ofertaId);
      setOfertaSeleccionada(oferta);
      setMostrarDetalle(true);
    } catch (error) {
      console.error('Error cargando inscritos:', error);
      setError('Error al cargar los inscritos');
    } finally {
      setLoading(false);
    }
  };

  const exportarDatosCompletos = async () => {
    if (!ofertaSeleccionada) return;
    try {
      setExportando(true);
      const response = await api.get(`/inscripciones/oferta/${ofertaSeleccionada._id}/exportar/completo`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inscripciones_completas_${ofertaSeleccionada.programa_formacion?.codigo}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess('Excel exportado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error exportando:', error);
      setError('Error al exportar los datos');
    } finally {
      setExportando(false);
    }
  };

  const exportarExcelCedulas = async () => {
    if (!ofertaSeleccionada) return;
    try {
      setExportando(true);
      const response = await api.get(`/inscripciones/oferta/${ofertaSeleccionada._id}/exportar/cedulas`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cedulas_${ofertaSeleccionada.programa_formacion?.codigo}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess('Excel de cédulas exportado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error exportando Excel de cédulas:', error);
      setError('Error al exportar el Excel de cédulas');
    } finally {
      setExportando(false);
    }
  };

  const fusionarPDFs = async () => {
    if (!ofertaSeleccionada) return;
    try {
      setFusionando(true);
      const response = await api.post(`/inscripciones/oferta/${ofertaSeleccionada._id}/fusionar-pdfs?download=true`, {}, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cedulas_fusionadas_${ofertaSeleccionada.programa_formacion?.codigo}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess('PDF fusionado descargado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error fusionando PDFs:', error);
      setError('Error al fusionar los PDFs');
    } finally {
      setFusionando(false);
    }
  };

  const volverAlInicio = () => {
    setMostrarDetalle(false);
    setOfertaSeleccionada(null);
    setInscritos([]);
  };

  const obtenerEstadoLink = (oferta) => {
    const disponibles = oferta.cupos_disponibles || 0;
    if (disponibles === 0) return { texto: 'Agotado', clase: 'bg-[#ffdad6] text-[#93000a]' };
    if (disponibles < 5) return { texto: `¡Últimos ${disponibles} cupos!`, clase: 'bg-orange-100 text-orange-700' };
    return { texto: `Disponible (${disponibles} cupos)`, clase: 'bg-[#6cf8bb]/30 text-[#005236]' };
  };

  const getInitials = (nombre, apellido) => {
    if (!nombre) return '?';
    const firstInitial = nombre.charAt(0).toUpperCase();
    const lastInitial = apellido ? apellido.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial;
  };

  const totalOfertas = ofertas.length;
  const totalInscritosGlobal = ofertas.reduce((sum, o) => sum + (o.cupo_maximo - (o.cupos_disponibles || 0)), 0);
  const disponibilidadMedia = totalOfertas > 0 
    ? Math.round((ofertas.reduce((sum, o) => sum + (o.cupos_disponibles || 0), 0) / ofertas.reduce((sum, o) => sum + (o.cupo_maximo || 0), 0)) * 100)
    : 0;
  const porcentajeCupos = ofertaSeleccionada ? Math.round((inscritos.length / ofertaSeleccionada.cupo_maximo) * 100) : 0;

  if (loading && !mostrarDetalle) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006c49] mx-auto mb-4"></div>
          <p className="text-[#45474c]">Cargando ofertas...</p>
        </div>
      </div>
    );
  }

  // VISTA DE LISTADO DE OFERTAS (CUANDO NO HAY DETALLE)
  if (!mostrarDetalle) {
    return (
      <div className="max-w-full">
        {/* Alerts */}
        {error && (
          <div className="fixed top-20 right-8 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 bg-[#ffdad6] border-[#ba1a1a] text-[#93000a] animate-in slide-in-from-right duration-300">
            <span className="material-symbols-outlined">error</span>
            <span className="font-medium">{error}</span>
            <button onClick={() => setError('')} className="ml-auto material-symbols-outlined text-sm opacity-60 hover:opacity-100">close</button>
          </div>
        )}
        {success && (
          <div className="fixed top-20 right-8 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 bg-[#6cf8bb]/30 border-[#005236] text-[#005236] animate-in slide-in-from-right duration-300">
            <span className="material-symbols-outlined">check_circle</span>
            <span className="font-medium">{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto material-symbols-outlined text-sm opacity-60 hover:opacity-100">close</button>
          </div>
        )}

        <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-semibold text-[#091426] mb-1">Inscritos por Oferta</h1>
            </div>
          </div>

          
          {/* Ofertas Table */}
          <div className="bg-white rounded-xl shadow-sm border border-[#c5c6cd] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#eff4ff] border-b border-[#c5c6cd]">
                  <tr>
                    <th className="px-6 py-3 text-xs text-[#45474c] uppercase tracking-wider">Programa</th>
                    <th className="px-6 py-3 text-xs text-[#45474c] uppercase tracking-wider">Código</th>
                    <th className="px-6 py-3 text-xs text-[#45474c] uppercase tracking-wider">Cupo Total</th>
                    <th className="px-6 py-3 text-xs text-[#45474c] uppercase tracking-wider">Inscritos</th>
                    <th className="px-6 py-3 text-xs text-[#45474c] uppercase tracking-wider">Disponibles</th>
                    <th className="px-6 py-3 text-xs text-[#45474c] uppercase tracking-wider">Estado del Link</th>
                    <th className="px-6 py-3 text-xs text-[#45474c] uppercase tracking-wider">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce9ff]">
                  {ofertas.map((oferta) => {
                    const inscritosCount = oferta.cupo_maximo - (oferta.cupos_disponibles || 0);
                    const estado = obtenerEstadoLink(oferta);
                    return (
                      <tr key={oferta._id} className="hover:bg-[#f8f9ff] transition-colors group">
                        <td className="px-6 py-4 font-medium text-[#091426]">{oferta.programa_formacion?.nombre_programa || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-[#45474c]">{oferta.programa_formacion?.codigo || 'N/A'}</td>
                        <td className="px-6 py-4">{oferta.cupo_maximo}</td>
                        <td className="px-6 py-4">{inscritosCount}</td>
                        <td className="px-6 py-4">{oferta.cupos_disponibles}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase ${estado.clase}`}>
                            {estado.texto}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => cargarInscritos(oferta._id)}
                            className="text-[#006c49] font-bold flex items-center gap-1 hover:underline transition-all"
                          >
                            Ver inscritos <span className="material-symbols-outlined text-sm">visibility</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {ofertas.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-[#c5c6cd]">
              <p className="text-[#45474c]">No tienes ofertas creadas aún.</p>
            </div>
          )}
        </section>
      </div>
    );
  }

  // ============================================
  // VISTA DE DETALLE DE INSCRITOS (ESTILO MODERNO)
  // ============================================
  return (
    <div className="max-w-full">
      {/* Alerts */}
      {error && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 bg-[#ffdad6] border-[#ba1a1a] text-[#93000a] animate-in slide-in-from-right duration-300">
          <span className="material-symbols-outlined">error</span>
          <span className="font-medium">{error}</span>
          <button onClick={() => setError('')} className="ml-auto material-symbols-outlined text-sm opacity-60 hover:opacity-100">close</button>
        </div>
      )}
      {success && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 bg-[#6cf8bb]/30 border-[#005236] text-[#005236] animate-in slide-in-from-right duration-300">
          <span className="material-symbols-outlined">check_circle</span>
          <span className="font-medium">{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto material-symbols-outlined text-sm opacity-60 hover:opacity-100">close</button>
        </div>
      )}

      {/* Breadcrumb & Back Action */}
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={volverAlInicio}
          className="flex items-center gap-1 text-[#006c49] hover:underline font-medium transition-all group"
        >
          <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
          <span>Volver a vista de cupos</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-[#dce9ff] text-[#0b1c30] rounded-lg text-xs font-medium">
            ID Curso: {ofertaSeleccionada.programa_formacion?.codigo}
          </span>
        </div>
      </div>

      {/* Course Info Header Card */}
      <section className="bg-white rounded-xl p-6 shadow-sm border border-[#c5c6cd] mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#006c49]/5 rounded-full -mr-16 -mt-16"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-[#091426] mb-2">
              {ofertaSeleccionada.programa_formacion?.nombre_programa}
            </h1>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-[#45474c]">
                <span className="material-symbols-outlined text-[#006c49]">groups</span>
                <span className="text-base">{inscritos.length} inscritos de {ofertaSeleccionada.cupo_maximo} totales</span>
              </div>
              <div className="flex items-center gap-2 text-[#45474c]">
                <span className="material-symbols-outlined text-[#006c49]">calendar_today</span>
                <span className="text-base">Ficha activa: {ofertaSeleccionada.fechas?.inicio?.split('-')[0] || '2024'}-{ofertaSeleccionada.fechas?.fin?.split('-')[0] || '2025'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="w-48 h-2 bg-[#e5eeff] rounded-full overflow-hidden mb-1">
              <div className="h-full bg-[#006c49] rounded-full" style={{ width: `${porcentajeCupos}%` }}></div>
            </div>
            <span className="text-xs font-bold text-[#006c49]">Capacidad Completa ({porcentajeCupos}%)</span>
          </div>
        </div>
      </section>

      {/* Action Bar */}
      <section className="mb-6 flex flex-wrap gap-3">
        <button 
          onClick={exportarDatosCompletos}
          disabled={exportando || inscritos.length === 0}
          className={`flex items-center gap-2 px-4 py-2.5 bg-[#006c49] text-white rounded-lg font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all text-sm ${(exportando || inscritos.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="material-symbols-outlined text-base">download</span>
          Exportar Datos Completos
        </button>
        <button 
          onClick={exportarExcelCedulas}
          disabled={exportando || inscritos.length === 0}
          className={`flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all text-sm ${(exportando || inscritos.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="material-symbols-outlined text-base">table_view</span>
          Exportar Excel-Cédulas
        </button>
        <button 
          onClick={fusionarPDFs}
          disabled={fusionando || inscritos.length === 0}
          className={`flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all text-sm ${(fusionando || inscritos.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span className="material-symbols-outlined text-base">picture_as_pdf</span>
          {fusionando ? 'Fusionando...' : 'Fusionar PDFs'}
        </button>
        <button 
          onClick={volverAlInicio}
          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg font-bold shadow-sm hover:brightness-110 active:scale-95 transition-all text-sm ml-auto"
        >
          <span className="material-symbols-outlined text-base">delete_sweep</span>
          Limpiar
        </button>
      </section>

      {/* Students Table */}
      <section className="bg-white rounded-xl shadow-sm border border-[#c5c6cd]">
        <div className="px-6 py-4 border-b border-[#c5c6cd] bg-[#eff4ff] flex justify-between items-center">
          <h2 className="text-lg font-bold text-[#091426]">Listado de Estudiantes Registrados</h2>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-[#dce9ff] rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[#45474c] text-base">filter_list</span>
            </button>
            <button className="p-2 hover:bg-[#dce9ff] rounded-lg transition-colors">
              <span className="material-symbols-outlined text-[#45474c] text-base">refresh</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-white sticky top-0 z-10">
                <th className="px-6 py-3 text-left text-xs font-medium text-[#091426] uppercase tracking-wider border-b border-[#c5c6cd]">Nombre Completo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#091426] uppercase tracking-wider border-b border-[#c5c6cd]">Tipo Documento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#091426] uppercase tracking-wider border-b border-[#c5c6cd]">Documento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#091426] uppercase tracking-wider border-b border-[#c5c6cd]">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#091426] uppercase tracking-wider border-b border-[#c5c6cd]">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[#091426] uppercase tracking-wider border-b border-[#c5c6cd]">Caracterización</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-[#091426] uppercase tracking-wider border-b border-[#c5c6cd]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c5c6cd]/30">
              {inscritos.map((inscrito, idx) => {
                const initials = getInitials(inscrito.nombres, inscrito.apellidos);
                const caracterizacion = inscrito.caracterizacion?.tipo_caracterizacion || 'General';
                const caracterizacionClase = caracterizacion === 'General' 
                  ? 'bg-[#dce9ff] text-[#0b1c30]' 
                  : caracterizacion === 'Población Vulnerable'
                  ? 'bg-[#6cf8bb]/30 text-[#005236]'
                  : 'bg-[#ffdad6] text-[#93000a]';
                
                return (
                  <tr key={inscrito._id} className="hover:bg-[#f8f9ff] transition-colors group">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${idx % 2 === 0 ? 'bg-[#6cf8bb]/50 text-[#005236]' : 'bg-[#d8e2ff] text-[#001334]'}`}>
                          {initials}
                        </div>
                        <span className="font-medium text-[#0b1c30]">{inscrito.nombres} {inscrito.apellidos}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-[#45474c]">{inscrito.tipo_documento?.nombre || 'N/A'}</td>
                    <td className="px-6 py-3 font-mono text-sm">{inscrito.numero_documento}</td>
                    <td className="px-6 py-3 text-[#45474c] text-sm">{inscrito.correo}</td>
                    <td className="px-6 py-3 text-[#45474c]">{inscrito.telefono}</td>
                    <td className="px-6 py-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${caracterizacionClase}`}>
                        {caracterizacion}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1 text-[#091426] hover:bg-[#dce9ff] rounded" title="Ver Perfil">
                          <span className="material-symbols-outlined text-base">visibility</span>
                        </button>
                        <button className="p-1 text-[#006c49] hover:bg-[#6cf8bb]/30 rounded" title="Editar">
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button className="p-1 text-[#ba1a1a] hover:bg-[#ffdad6] rounded" title="Inactivar">
                          <span className="material-symbols-outlined text-base">block</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {inscritos.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-[#c5c6cd]">
          <p className="text-[#45474c]">No hay inscritos para esta oferta aún.</p>
        </div>
      )}
    </div>
  );
};

export default VerInscritos;