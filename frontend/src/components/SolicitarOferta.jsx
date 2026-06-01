import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatLocalDate } from '../utils/dateUtils';

const SolicitarOferta = () => {
  const [ofertas, setOfertas] = useState([]);
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);
  const [coordinador, setCoordinador] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inscritos, setInscritos] = useState([]);
  const [cargandoCoordinador, setCargandoCoordinador] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [mostrarRechazadas, setMostrarRechazadas] = useState(false);

  useEffect(() => {
    // Verificar si viene de LinksInscripcion con una oferta para reenviar
    const ofertaIdParaReenviar = localStorage.getItem('ofertaParaReenviar');
    if (ofertaIdParaReenviar) {
      cargarOfertasRechazadasYSeleccionar(ofertaIdParaReenviar);
      localStorage.removeItem('ofertaParaReenviar');
    } else {
      cargarOfertasNormales();
    }
  }, []);

  // Cargar solo ofertas pendientes
  const cargarOfertasNormales = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ofertas/mis-ofertas');
      const todasOfertas = response.data.data || [];
      // ✅ Solo mostrar ofertas pendientes
      const ofertasPendientes = todasOfertas.filter(o => 
        o.estado?.codigo === 'pendiente'
      );
      setOfertas(ofertasPendientes);
      setMostrarRechazadas(false);
    } catch (error) {
      console.error('Error cargando ofertas:', error);
      setError('Error al cargar las ofertas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar solo ofertas rechazadas
  const cargarOfertasRechazadas = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ofertas/mis-ofertas');
      const todasOfertas = response.data.data || [];
      // ✅ Solo mostrar ofertas rechazadas
      const soloRechazadas = todasOfertas.filter(o => o.estado?.codigo === 'rechazada');
      setOfertas(soloRechazadas);
      setMostrarRechazadas(true);
    } catch (error) {
      console.error('Error cargando ofertas rechazadas:', error);
      setError('Error al cargar las ofertas rechazadas');
    } finally {
      setLoading(false);
    }
  };

  // Cargar ofertas rechazadas y seleccionar una específica (para cuando viene de LinksInscripcion)
  const cargarOfertasRechazadasYSeleccionar = async (ofertaId) => {
    try {
      setLoading(true);
      const response = await api.get('/ofertas/mis-ofertas');
      const todasOfertas = response.data.data || [];
      const soloRechazadas = todasOfertas.filter(o => o.estado?.codigo === 'rechazada');
      setOfertas(soloRechazadas);
      setMostrarRechazadas(true);
      
      // Seleccionar la oferta específica
      const oferta = soloRechazadas.find(o => o._id === ofertaId);
      if (oferta) {
        setOfertaSeleccionada(oferta);
        await cargarInscritos(ofertaId);
        
        // Cargar datos del coordinador
        let coordinadorData = null;
        if (oferta.coordinador_asignado) {
          if (oferta.coordinador_asignado.nombre) {
            coordinadorData = {
              nombre: oferta.coordinador_asignado.nombre,
              correoElectronico: oferta.coordinador_asignado.correoElectronico || 'No disponible',
              telefono: oferta.coordinador_asignado.telefono || 'No disponible'
            };
          }
        }
        
        if (coordinadorData) {
          setCoordinador(coordinadorData);
        } else {
          setCoordinador({
            nombre: 'No asignado',
            correoElectronico: 'No disponible',
            telefono: 'No disponible'
          });
        }
      }
    } catch (error) {
      console.error('Error cargando ofertas rechazadas:', error);
      setError('Error al cargar las ofertas rechazadas');
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
    }
  };

  const handleOfertaChange = async (e) => {
    const ofertaId = e.target.value;
    if (!ofertaId) {
      setOfertaSeleccionada(null);
      setCoordinador(null);
      setInscritos([]);
      return;
    }

    const oferta = ofertas.find(o => o._id === ofertaId);
    console.log('📦 Oferta seleccionada:', oferta);
    setOfertaSeleccionada(oferta);
    await cargarInscritos(ofertaId);
    
    // Extraer datos del coordinador de la oferta
    let coordinadorData = null;
    
    if (oferta.coordinador_asignado) {
      if (oferta.coordinador_asignado.nombre) {
        coordinadorData = {
          nombre: oferta.coordinador_asignado.nombre,
          correoElectronico: oferta.coordinador_asignado.correoElectronico || 'No disponible',
          telefono: oferta.coordinador_asignado.telefono || 'No disponible'
        };
      }
      
      const coordinadorId = oferta.coordinador_asignado._id || oferta.coordinador_asignado;
      if (coordinadorId && (!coordinadorData || coordinadorData.correoElectronico === 'No disponible')) {
        setCargandoCoordinador(true);
        try {
          let response;
          try {
            response = await api.get(`/usuarios/${coordinadorId}`);
          } catch (e) {
            try {
              response = await api.get(`/coordinadores/${coordinadorId}`);
            } catch (e2) {
              response = await api.get(`/api/usuarios/${coordinadorId}`);
            }
          }
          
          if (response.data && (response.data.data || response.data)) {
            const data = response.data.data || response.data;
            coordinadorData = {
              nombre: data.nombre || coordinadorData?.nombre || 'No asignado',
              correoElectronico: data.correoElectronico || data.email || 'No disponible',
              telefono: data.telefono || 'No disponible'
            };
          }
        } catch (error) {
          console.log('⚠️ No se pudo obtener datos adicionales del coordinador');
        } finally {
          setCargandoCoordinador(false);
        }
      }
    }
    
    if (coordinadorData) {
      setCoordinador(coordinadorData);
    } else {
      setCoordinador({
        nombre: 'No asignado',
        correoElectronico: 'No disponible',
        telefono: 'No disponible'
      });
    }
  };

  // Enviar solicitud (para ofertas pendientes)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ofertaSeleccionada) {
      setError('Debe seleccionar una oferta');
      return;
    }

    if (inscritos.length < ofertaSeleccionada.cupo_maximo) {
      const faltantes = ofertaSeleccionada.cupo_maximo - inscritos.length;
      setError(`⚠️ No se puede enviar oferta porque aún faltan ${faltantes} aprendiz(es) por inscribirse. Debe completar el cupo total (${ofertaSeleccionada.cupo_maximo}) antes de enviar la solicitud.`);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/solicitudes/validacion', {
        oferta_id: ofertaSeleccionada._id,
        mensaje: mensaje
      });

      setSuccess('✅ Solicitud enviada exitosamente al coordinador');
      setTimeout(() => setSuccess(''), 5000);
      
      // Limpiar selección
      setOfertaSeleccionada(null);
      setCoordinador(null);
      setInscritos([]);
      setMensaje('');
      
      // Recargar ofertas pendientes
      cargarOfertasNormales();
      
    } catch (error) {
      console.error('Error enviando solicitud:', error);
      setError(error.response?.data?.message || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  // Reenviar oferta rechazada
  const handleReenviarRechazada = async () => {
    if (!ofertaSeleccionada) {
      setError('Debe seleccionar una oferta');
      return;
    }

    if (inscritos.length < ofertaSeleccionada.cupo_maximo) {
      const faltantes = ofertaSeleccionada.cupo_maximo - inscritos.length;
      setError(`⚠️ No se puede reenviar la oferta porque aún faltan ${faltantes} aprendiz(es) por inscribirse. Debe completar el cupo total (${ofertaSeleccionada.cupo_maximo}) antes de reenviar la solicitud.`);
      return;
    }

    setReenviando(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post(`/ofertas/${ofertaSeleccionada._id}/reenviar`, {
        mensaje: mensaje || 'He corregido los aspectos señalados y completado los cupos, solicito amablemente revisar nuevamente la oferta.'
      });

      setSuccess('✅ Oferta reenviada exitosamente al coordinador');
      setTimeout(() => setSuccess(''), 5000);
      
      // Resetear selección
      setOfertaSeleccionada(null);
      setCoordinador(null);
      setInscritos([]);
      setMensaje('');
      
      // Recargar ofertas pendientes (la oferta ahora está pendiente)
      cargarOfertasNormales();
      setMostrarRechazadas(false);
      
    } catch (error) {
      console.error('Error reenviando oferta:', error);
      setError(error.response?.data?.message || 'Error al reenviar la oferta');
    } finally {
      setReenviando(false);
    }
  };

  // Función para habilitar más cupos (actualizar cupo máximo)
  const habilitarMasCupos = async (nuevoCupoMaximo) => {
    if (!ofertaSeleccionada) return;
    
    if (nuevoCupoMaximo <= inscritos.length) {
      setError(`El nuevo cupo máximo (${nuevoCupoMaximo}) debe ser mayor a los inscritos actuales (${inscritos.length})`);
      return;
    }
    
    try {
      setLoading(true);
      const nuevosCuposDisponibles = nuevoCupoMaximo - inscritos.length;
      
      const response = await api.put(`/ofertas/${ofertaSeleccionada._id}`, {
        cupo_maximo: nuevoCupoMaximo,
        cupos_disponibles: nuevosCuposDisponibles
      });
      
      setOfertaSeleccionada(response.data.data);
      setSuccess(`✅ Cupos actualizados: ahora hay ${nuevoCupoMaximo - inscritos.length} cupos disponibles`);
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('Error actualizando cupos:', error);
      setError('Error al actualizar los cupos');
    } finally {
      setLoading(false);
    }
  };

  const descargarFicha = async (ofertaId) => {
    try {
      const response = await api.get(`/ofertas/${ofertaId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ficha-${ofertaId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error descargando ficha:', error);
      alert('No se pudo descargar la ficha');
    }
  };

  const descargarCarta = async (ofertaId) => {
    try {
      const response = await api.get(`/ofertas/${ofertaId}/carta`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `carta-${ofertaId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error descargando carta:', error);
      alert('No se pudo descargar la carta');
    }
  };

  const descargarExcelCedulas = async (ofertaId) => {
    try {
      const response = await api.get(`/inscripciones/oferta/${ofertaId}/exportar/cedulas`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cedulas-${ofertaId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error descargando Excel:', error);
      alert('No se pudo generar el Excel de cédulas');
    }
  };

  const descargarCedulasPDF = async (ofertaId) => {
    try {
      const response = await api.post(`/inscripciones/oferta/${ofertaId}/fusionar-pdfs?download=true`, {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cedulas_fusionadas_${ofertaId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error descargando PDF de cédulas:', error);
      alert('No se pudo generar el PDF de cédulas escaneadas');
    }
  };

  const formatDate = (dateString) => formatLocalDate(dateString);
  const porcentajeCupos = ofertaSeleccionada ? Math.round((inscritos.length / ofertaSeleccionada.cupo_maximo) * 100) : 0;

  const getCoordinadorNombre = () => {
    if (cargandoCoordinador) return 'Cargando...';
    if (!coordinador) return 'Seleccione una oferta';
    return coordinador.nombre || 'No asignado';
  };

  const getCoordinadorEmail = () => {
    if (cargandoCoordinador) return 'Cargando...';
    if (!coordinador) return '';
    return coordinador.correoElectronico || 'No disponible';
  };

  const getCoordinadorTelefono = () => {
    if (cargandoCoordinador) return 'Cargando...';
    if (!coordinador) return '';
    return coordinador.telefono || 'No disponible';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-[#091426] tracking-tight">
          📋 Enviar Oferta 
        </h1>
        <p className="text-lg text-[#45474c] max-w-2xl">
          Prepare y envíe la documentación requerida para la validación de la oferta
        </p>
      </section>

      {error && (
        <div className="bg-[#ffdad6] text-[#93000a] p-4 rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-[#6cf8bb]/30 text-[#005236] p-4 rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined">check_circle</span>
          <span>{success}</span>
        </div>
      )}

      {/* Botones para cambiar entre vistas */}
      <div className="flex gap-2">
        <button
          onClick={cargarOfertasNormales}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            !mostrarRechazadas 
              ? 'bg-[#006c49] text-white' 
              : 'bg-[#e5eeff] text-[#001334] hover:bg-[#dce9ff]'
          }`}
        >
          Ofertas Pendientes
        </button>
        <button
          onClick={cargarOfertasRechazadas}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            mostrarRechazadas 
              ? 'bg-orange-600 text-white' 
              : 'bg-[#e5eeff] text-[#001334] hover:bg-[#dce9ff]'
          }`}
        >
          Ofertas Rechazadas
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assigned Coordinator Card */}
        <div className="lg:col-span-1 p-6 rounded-xl bg-[#eff4ff] border border-[#dce9ff] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 text-[#006c49]/5 group-hover:text-[#006c49]/10 transition-colors">
            <span className="material-symbols-outlined !text-9xl" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#006c49]" style={{ fontVariationSettings: "'FILL' 1" }}>person_search</span>
              <h2 className="text-xs font-medium text-[#006c49] uppercase tracking-wider">Coordinador Asignado</h2>
            </div>
            <div>
              <p className="text-xs text-[#75777d] mb-1">Nombre del coordinador</p>
              <p className="font-bold text-[#0b1c30] text-base">{getCoordinadorNombre()}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs text-[#75777d] mb-1">Correo Electrónico</p>
                <p className="text-sm font-medium text-[#0b1c30] break-all">{getCoordinadorEmail()}</p>
              </div>
              <div>
                <p className="text-xs text-[#75777d] mb-1">Teléfono</p>
                <p className="text-sm font-medium text-[#0b1c30]">{getCoordinadorTelefono()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 p-6 rounded-xl bg-white border border-[#c5c6cd] shadow-sm flex flex-col justify-center space-y-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#091426]">sell</span>
            <h2 className="text-2xl font-semibold text-[#091426]">Selección de Oferta</h2>
          </div>
          <div className="relative">
            <select
              onChange={handleOfertaChange}
              className="w-full appearance-none bg-[#f8f9ff] border border-[#c5c6cd] rounded-lg px-4 py-3 text-[#0b1c30] focus:ring-2 focus:ring-[#006c49]/20 transition-all cursor-pointer font-medium"
              defaultValue=""
            >
              <option value="">-- Seleccione una oferta --</option>
              {ofertas.map(oferta => (
                <option key={oferta._id} value={oferta._id}>
                  {oferta.programa_formacion?.nombre_programa} - {oferta.programa_formacion?.codigo}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#75777d]">expand_more</span>
          </div>
          {ofertas.length === 0 && !loading && (
            <p className="text-sm text-[#75777d] text-center">
              {mostrarRechazadas ? 'No hay ofertas rechazadas' : 'No hay ofertas pendientes para enviar'}
            </p>
          )}
        </div>
      </div>

      {ofertaSeleccionada && (
        <>
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-[#091426]">Detalles de la Oferta Seleccionada</h3>
              <span className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                ofertaSeleccionada.estado?.codigo === 'aprobada' ? 'bg-[#6cf8bb]/30 text-[#005236]' :
                ofertaSeleccionada.estado?.codigo === 'pendiente' ? 'bg-orange-100 text-orange-700' :
                ofertaSeleccionada.estado?.codigo === 'rechazada' ? 'bg-red-100 text-red-700' :
                'bg-[#e5eeff] text-[#001334]'
              }`}>
                Estado: {ofertaSeleccionada.estado?.nombre || ofertaSeleccionada.estado?.codigo || 'Pendiente'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-white border border-[#c5c6cd] shadow-sm">
                <p className="text-xs text-[#75777d] mb-1">Código del Programa</p>
                <p className="font-bold text-[#0b1c30]">{ofertaSeleccionada.programa_formacion?.codigo || 'N/A'}</p>
              </div>
              <div className="p-4 rounded-lg bg-white border border-[#c5c6cd] shadow-sm lg:col-span-2">
                <p className="text-xs text-[#75777d] mb-1">Nombre del Programa</p>
                <p className="font-bold text-[#0b1c30]">{ofertaSeleccionada.programa_formacion?.nombre_programa || 'N/A'}</p>
              </div>
              <div className="p-4 rounded-lg bg-white border border-[#c5c6cd] shadow-sm">
                <p className="text-xs text-[#75777d] mb-1">Tipo de Formación</p>
                <p className="font-bold text-[#0b1c30]">{ofertaSeleccionada.es_campesena ? 'Campesena' : 'Regular'}</p>
              </div>
              <div className="p-4 rounded-lg bg-white border border-[#c5c6cd] shadow-sm">
                <p className="text-xs text-[#75777d] mb-1">Fecha de Inicio</p>
                <p className="font-bold text-[#0b1c30]">{formatDate(ofertaSeleccionada.fechas?.inicio)}</p>
              </div>
              <div className="p-4 rounded-lg bg-white border border-[#c5c6cd] shadow-sm">
                <p className="text-xs text-[#75777d] mb-1">Fecha de Fin</p>
                <p className="font-bold text-[#0b1c30]">{formatDate(ofertaSeleccionada.fechas?.fin)}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-white border border-[#c5c6cd] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-[#75777d]">Progreso de Inscripción</p>
                <span className="text-xs font-bold text-[#ba1a1a]">{inscritos.length} / {ofertaSeleccionada.cupo_maximo} cupos</span>
              </div>
              <div className="h-2 w-full bg-[#e5eeff] rounded-full overflow-hidden">
                <div className="h-full bg-[#ba1a1a] rounded-full transition-all duration-500" style={{ width: `${porcentajeCupos}%` }}></div>
              </div>
              {inscritos.length < ofertaSeleccionada.cupo_maximo && (
                <div className="mt-4 flex items-start gap-2 p-3 bg-[#ffdad6]/30 rounded-lg border border-[#ba1a1a]/10">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-lg">warning</span>
                  <p className="text-sm text-[#93000a] leading-tight">
                    <strong>Advertencia:</strong> La oferta no ha alcanzado el 100% de la meta de inscritos. 
                    Faltan {ofertaSeleccionada.cupo_maximo - inscritos.length} aprendiz(es) para completar el cupo.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-2xl font-semibold text-[#091426]">Gestión de Documentos</h3>
            <div className="bg-white border border-[#c5c6cd] rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#eff4ff] border-b border-[#c5c6cd]">
                  <tr>
                    <th className="px-6 py-4 text-xs text-[#75777d] uppercase tracking-wider">Documento Requerido</th>
                    <th className="px-6 py-4 text-xs text-[#75777d] uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-4 text-xs text-[#75777d] uppercase tracking-wider text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c5c6cd]/30">
                  <tr className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#ffdad6]/20 rounded flex items-center justify-center text-[#ba1a1a]">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>picture_as_pdf</span>
                        </div>
                        <div>
                          <p className="font-bold text-[#0b1c30]">Ficha de Caracterización</p>
                          <p className="text-xs text-[#75777d]">Formato oficial SENA (.pdf)</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-[#6cf8bb]/30 text-[#005236] text-[11px] font-bold uppercase tracking-wider">Disponible</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => descargarFicha(ofertaSeleccionada._id)} className="text-[#006c49] font-bold text-sm hover:underline flex items-center gap-1 ml-auto transition-transform active:scale-95">
                        <span className="material-symbols-outlined text-lg">download</span> Ver / Descargar
                      </button>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#1e293b]/10 rounded flex items-center justify-center text-[#1e293b]">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                        </div>
                        <div>
                          <p className="font-bold text-[#0b1c30]">Carta de Presentación</p>
                          <p className="text-xs text-[#75777d]">Firmada por representante legal</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        ofertaSeleccionada?.carta_pdf ? 'bg-[#6cf8bb]/30 text-[#005236]' : 'bg-[#e5eeff] text-[#001334]'
                      }`}>
                        {ofertaSeleccionada?.carta_pdf ? 'Adjunto' : 'No Adjunto'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {ofertaSeleccionada?.carta_pdf ? (
                        <button onClick={() => descargarCarta(ofertaSeleccionada._id)} className="text-[#006c49] font-bold text-sm hover:underline flex items-center gap-1 ml-auto transition-transform active:scale-95">
                          <span className="material-symbols-outlined text-lg">download</span> Ver / Descargar
                        </button>
                      ) : (
                        <span className="text-[#75777d] text-sm">No disponible</span>
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#6cf8bb]/20 rounded flex items-center justify-center text-[#006c49]">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>table_chart</span>
                        </div>
                        <div>
                          <p className="font-bold text-[#0b1c30]">Listado de Cédulas (Excel)</p>
                          <p className="text-xs text-[#75777d]">Consolidado de aprendices matriculados</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-[#6cf8bb]/30 text-[#005236] text-[11px] font-bold uppercase tracking-wider">
                        {inscritos.length} Registros
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {inscritos.length > 0 ? (
                        <button onClick={() => descargarExcelCedulas(ofertaSeleccionada._id)} className="text-[#006c49] font-bold text-sm hover:underline flex items-center gap-1 ml-auto transition-transform active:scale-95">
                          <span className="material-symbols-outlined text-lg">download</span> Descargar Excel
                        </button>
                      ) : (
                        <span className="text-[#75777d] text-sm">Sin inscritos</span>
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#ffdad6]/20 rounded flex items-center justify-center text-[#ba1a1a]">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>folder_zip</span>
                        </div>
                        <div>
                          <p className="font-bold text-[#0b1c30]">Cédulas Escaneadas (PDF)</p>
                          <p className="text-xs text-[#75777d]">Paquete de documentos de identidad</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                        inscritos.length > 0 ? 'bg-[#6cf8bb]/30 text-[#005236]' : 'bg-[#e5eeff] text-[#001334]'
                      }`}>
                        {inscritos.length > 0 ? 'Disponible' : 'Sin cédulas'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {inscritos.length > 0 ? (
                        <button onClick={() => descargarCedulasPDF(ofertaSeleccionada._id)} className="text-[#006c49] font-bold text-sm hover:underline flex items-center gap-1 ml-auto transition-transform active:scale-95">
                          <span className="material-symbols-outlined text-lg">visibility</span> Visualizar
                        </button>
                      ) : (
                        <span className="text-[#75777d] text-sm">No disponible</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#091426]">chat_bubble</span>
              <h3 className="text-2xl font-semibold text-[#091426]">Mensaje Adicional para el Coordinador</h3>
            </div>
            <div className="bg-white border border-[#c5c6cd] rounded-xl p-4 shadow-sm">
              <textarea
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                className="w-full min-h-[120px] bg-transparent border-none focus:ring-0 p-0 text-[#0b1c30] placeholder:text-[#75777d]/50 resize-y outline-none"
                placeholder="Escriba aquí cualquier observación o justificación para la validación de esta oferta (opcional)..."
              />
            </div>
          </section>

          {/* Botones específicos según el estado de la oferta */}
          {mostrarRechazadas ? (
            // Para ofertas rechazadas
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined">group_add</span>
                  Habilitar más cupos
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  Actualmente hay {inscritos.length} inscritos de {ofertaSeleccionada.cupo_maximo} cupos totales.
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    id="nuevoCupo"
                    placeholder="Nuevo cupo máximo"
                    className="flex-1 px-3 py-2 border border-blue-300 rounded-lg text-sm"
                    min={inscritos.length + 1}
                  />
                  <button
                    onClick={() => {
                      const nuevoCupo = parseInt(document.getElementById('nuevoCupo').value);
                      if (nuevoCupo && nuevoCupo > inscritos.length) {
                        habilitarMasCupos(nuevoCupo);
                      } else {
                        setError(`El cupo debe ser mayor a ${inscritos.length} inscritos`);
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Actualizar Cupos
                  </button>
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined">send</span>
                  Reenviar al Coordinador
                </h4>
                <p className="text-sm text-orange-700 mb-3">
                  Una vez que hayas corregido los documentos y completado los cupos, puedes reenviar la oferta.
                </p>
                <button
                  onClick={handleReenviarRechazada}
                  disabled={reenviando || inscritos.length < ofertaSeleccionada.cupo_maximo}
                  className={`w-full bg-orange-600 text-white py-2 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                    (reenviando || inscritos.length < ofertaSeleccionada.cupo_maximo) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-700'
                  }`}
                >
                  {reenviando ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      Reenviando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">refresh</span>
                      Reenviar Oferta al Coordinador
                    </>
                  )}
                </button>
                {inscritos.length < ofertaSeleccionada.cupo_maximo && (
                  <p className="text-xs text-orange-600 mt-2">
                    Faltan {ofertaSeleccionada.cupo_maximo - inscritos.length} inscritos para poder reenviar
                  </p>
                )}
              </div>
            </div>
          ) : (
            // Para ofertas pendientes - botón normal
            <footer className="bg-[#091426] text-white rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">outgoing_mail</span>
                </div>
                <div>
                  <p className="text-white/70 text-sm">Destinatario de la solicitud</p>
                  <p className="font-bold text-lg">{getCoordinadorNombre()} <span className="text-[#6cf8bb] font-medium ml-2 text-sm">(Coordinador Académico)</span></p>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  onClick={handleSubmit}
                  disabled={loading || inscritos.length < (ofertaSeleccionada?.cupo_maximo || 0)}
                  className={`flex-1 md:flex-none px-8 py-3 bg-[#6cf8bb] text-[#005236] rounded-lg hover:brightness-95 transition-all font-extrabold text-base flex items-center justify-center gap-2 active:scale-95 shadow-lg ${
                    (loading || inscritos.length < (ofertaSeleccionada?.cupo_maximo || 0)) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <span className="material-symbols-outlined animate-spin">progress_activity</span>
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Solicitud <span className="material-symbols-outlined">send</span>
                    </>
                  )}
                </button>
              </div>
            </footer>
          )}
        </>
      )}

      {!ofertaSeleccionada && ofertas.length > 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-[#c5c6cd]">
          <p className="text-[#45474c]">Seleccione una oferta para continuar con el proceso de validación.</p>
        </div>
      )}

      {ofertas.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-xl border border-[#c5c6cd]">
          <p className="text-[#45474c]">
            {mostrarRechazadas 
              ? 'No tienes ofertas rechazadas. Las ofertas rechazadas aparecerán aquí para que puedas corregirlas y reenviarlas.' 
              : 'No tienes ofertas pendientes para enviar. Tus ofertas pendientes aparecerán aquí cuando las crees.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SolicitarOferta;