import React, { useState, useEffect } from 'react';
import api from '../services/api';

const FuncionarioDashboard = () => {
  const [vistaActiva, setVistaActiva] = useState('ofertas');
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);
  const [inscritos, setInscritos] = useState([]);
  const [cargandoInscritos, setCargandoInscritos] = useState(false);
  const [datosEmpresa, setDatosEmpresa] = useState(null);
  const [cargandoEmpresa, setCargandoEmpresa] = useState(false);
  const [datosInstructor, setDatosInstructor] = useState(null);
  const [cargandoInstructor, setCargandoInstructor] = useState(false);
  const [instructoresCampesena, setInstructoresCampesena] = useState([]);
  const [cargandoInstructores, setCargandoInstructores] = useState(false);
  
  // Estados para el proceso de ficha
  const [mostrarModalProceso, setMostrarModalProceso] = useState(false);
  const [resumenProceso, setResumenProceso] = useState(null);
  const [cargandoProceso, setCargandoProceso] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [observacionesMatricula, setObservacionesMatricula] = useState('');
  const [codigoFichaDirecto, setCodigoFichaDirecto] = useState('');
  const [observacionesDirectas, setObservacionesDirectas] = useState('');

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const tipoFuncionario = user.tipo_funcionario || 'regular';
  const nombreFuncionario = user.nombre || 'Funcionario';
  const apellidoFuncionario = user.apellido || '';

  useEffect(() => {
    cargarOfertasAprobadas();
  }, []);

  const cargarOfertasAprobadas = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/ofertas-funcionario/aprobadas/${tipoFuncionario}`);
      setOfertas(response.data.data || []);
    } catch (error) {
      console.error('Error cargando ofertas:', error);
      setError('Error al cargar las ofertas aprobadas');
    } finally {
      setLoading(false);
    }
  };

  const cargarInstructoresCampesena = async (ofertaId) => {
    if (!ofertaId) return;
    setCargandoInstructores(true);
    try {
      const response = await api.get(`/instructores/oferta/${ofertaId}`);
      setInstructoresCampesena(response.data.data || []);
    } catch (error) {
      console.error('Error cargando instructores:', error);
    } finally {
      setCargandoInstructores(false);
    }
  };

  const cargarInscritos = async (ofertaId) => {
    setCargandoInscritos(true);
    try {
      const response = await api.get(`/inscripciones/oferta/${ofertaId}`);
      setInscritos(response.data.data || []);
    } catch (error) {
      console.error('Error cargando inscritos:', error);
      setError('Error al cargar los inscritos');
    } finally {
      setCargandoInscritos(false);
    }
  };

  const cargarDatosEmpresa = async (empresaId) => {
    if (!empresaId) return;
    setCargandoEmpresa(true);
    try {
      const response = await api.get(`/empresas/${empresaId}`);
      setDatosEmpresa(response.data.data);
    } catch (error) {
      console.error('Error cargando empresa:', error);
    } finally {
      setCargandoEmpresa(false);
    }
  };

  const cargarDatosInstructor = async (instructorId) => {
    if (!instructorId) return;
    setCargandoInstructor(true);
    try {
      const response = await api.get(`/usuarios/${instructorId}`);
      setDatosInstructor(response.data.data);
    } catch (error) {
      console.error('Error cargando instructor:', error);
      setDatosInstructor({
        nombre: ofertaSeleccionada?.creado_por?.nombre,
        apellido: ofertaSeleccionada?.creado_por?.apellido,
        correoElectronico: ofertaSeleccionada?.creado_por?.correoElectronico || 'No disponible',
        telefono: ofertaSeleccionada?.creado_por?.telefono || 'No disponible'
      });
    } finally {
      setCargandoInstructor(false);
    }
  };

  const cargarResumenProceso = async (ofertaId) => {
    setCargandoProceso(true);
    try {
      const response = await api.get(`/ficha/${ofertaId}/resumen`);
      const data = response.data.data || {};
      setResumenProceso({
        oferta: data.oferta || { estado: '', estado_codigo: '' },
        fechas: data.fechas || {},
        inscritos: data.inscritos || { total: 0 },
        validacion: data.validacion || { aprobados: 0, rechazados: 0 },
        documentos: data.documentos || { tiene_excel_funcionario: false, tiene_excel_validado: false },
        lista_aprobados: data.lista_aprobados || [],
        lista_rechazados: data.lista_rechazados || [],
        observaciones: data.observaciones || ''
      });
    } catch (error) {
      console.error('Error cargando resumen:', error);
      setResumenProceso({
        oferta: { estado: '', estado_codigo: '' },
        fechas: {},
        inscritos: { total: 0 },
        validacion: { aprobados: 0, rechazados: 0 },
        documentos: { tiene_excel_funcionario: false, tiene_excel_validado: false },
        lista_aprobados: [],
        lista_rechazados: [],
        observaciones: ''
      });
    } finally {
      setCargandoProceso(false);
    }
  };

  // ===== FUNCIÓN PRINCIPAL: Ver detalles + iniciar proceso de ficha =====
  const handleVerDetalles = async (oferta) => {
    setOfertaSeleccionada(oferta);
    setDatosEmpresa(null);
    setDatosInstructor(null);
    setInstructoresCampesena([]);
    
    await cargarInscritos(oferta._id);
    
    if (oferta.empresa_solicitante?._id || oferta.empresa_solicitante) {
      const empresaId = oferta.empresa_solicitante._id || oferta.empresa_solicitante;
      await cargarDatosEmpresa(empresaId);
    }
    
    if (oferta.creado_por?._id || oferta.creado_por) {
      const instructorId = oferta.creado_por._id || oferta.creado_por;
      await cargarDatosInstructor(instructorId);
    }
    
    if (oferta.es_campesena) {
      await cargarInstructoresCampesena(oferta._id);
    }

    // ✅ INICIAR PROCESO DE FICHA - Cambia estado a "Ficha en proceso de creación"
    const historial = oferta.historial_administrativo || [];
    const ultimoEstadoAdmin = historial.length > 0
      ? historial[historial.length - 1].estado
      : 'lista_espera';
    console.log('📌 Estado administrativo actual (historial):', ultimoEstadoAdmin);

    // Iniciar proceso si está en lista_espera o no tiene historial
    const estadosPermitidos = ['aprobada', 'lista_espera', 'creada', null];
    if (estadosPermitidos.includes(ultimoEstadoAdmin)) {
      try {
        console.log('🚀 Iniciando proceso de ficha para oferta:', oferta._id);
        const response = await api.post(`/ficha/${oferta._id}/iniciar-proceso`);
        console.log('✅ Proceso de ficha iniciado correctamente:', response.data);
        
        // Recargar la oferta para obtener el nuevo estado
        const ofertaResponse = await api.get(`/ofertas/${oferta._id}`);
        const nuevaOferta = ofertaResponse.data.data;
        setOfertaSeleccionada(nuevaOferta);
        
        // Actualizar la lista de ofertas
        setOfertas(prevOfertas => 
          prevOfertas.map(o => 
            o._id === oferta._id ? nuevaOferta : o
          )
        );
        
        setSuccess('✅ Estado actualizado a "Ficha en proceso de creación"');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('❌ Error iniciando proceso:', error);
        setError('Error al iniciar el proceso de ficha: ' + (error.response?.data?.message || error.message));
        setTimeout(() => setError(''), 5000);
      }
    } else {
      console.log('ℹ️ La oferta ya está en proceso o finalizada:', ultimoEstadoAdmin);
    }

    // Cargar resumen y abrir modal
    await cargarResumenProceso(oferta._id);
    setMostrarModalProceso(true);
  };

  const handleGenerarExcel = async () => {
    try {
      const response = await api.get(`/ficha/${ofertaSeleccionada._id}/generar-excel`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `aspirantes_validar_${ofertaSeleccionada.programa_formacion?.codigo || 'oferta'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setSuccess('✅ Excel generado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al generar el Excel');
    }
  };

  const handleSubirExcel = async () => {
    if (!archivoSeleccionado) {
      setError('Debe seleccionar un archivo Excel');
      return;
    }

    const formData = new FormData();
    formData.append('excel', archivoSeleccionado);

    try {
      const response = await api.post(`/ficha/${ofertaSeleccionada._id}/subir-excel`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess(response.data.message);
      await cargarResumenProceso(ofertaSeleccionada._id);
      setArchivoSeleccionado(null);
      
      const ofertaResponse = await api.get(`/ofertas/${ofertaSeleccionada._id}`);
      setOfertaSeleccionada(ofertaResponse.data.data);
      
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Error al subir el Excel');
    }
  };

  const handleMatricularDirecto = async () => {
    try {
      const response = await api.post(`/ficha/${ofertaSeleccionada._id}/matricular-directo`, {
        codigo_ficha: codigoFichaDirecto,
        observaciones: observacionesDirectas
      });

      setSuccess(response.data.message);
      setCodigoFichaDirecto('');
      setObservacionesDirectas('');
      await cargarResumenProceso(ofertaSeleccionada._id);
      const ofertaResponse = await api.get(`/ofertas/${ofertaSeleccionada._id}`);
      setOfertaSeleccionada(ofertaResponse.data.data);
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Error al realizar matrícula');
    }
  };

  const handleConfirmarMatricula = async () => {
    try {
      const response = await api.post(`/ficha/${ofertaSeleccionada._id}/confirmar-matricula`, {
        observaciones: observacionesMatricula
      });
      
      setSuccess(response.data.message);
      await cargarResumenProceso(ofertaSeleccionada._id);
      setObservacionesMatricula('');
      
      const ofertaResponse = await api.get(`/ofertas/${ofertaSeleccionada._id}`);
      setOfertaSeleccionada(ofertaResponse.data.data);
      
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Error al confirmar matrícula');
    }
  };

  const descargarDocumento = async (ofertaId, tipo) => {
    try {
      let url = '';
      let filename = '';
      let method = 'get';
      
      switch (tipo) {
        case 'ficha':
          url = `/ofertas/${ofertaId}/pdf`;
          filename = `ficha_${ofertaId}.pdf`;
          break;
        case 'carta':
          url = `/ofertas/${ofertaId}/carta`;
          filename = `carta_${ofertaId}.pdf`;
          break;
        case 'excel':
          url = `/inscripciones/oferta/${ofertaId}/exportar/cedulas`;
          filename = `cedulas_${ofertaId}.xlsx`;
          break;
        case 'cedulas':
          url = `/inscripciones/oferta/${ofertaId}/fusionar-pdfs?download=true`;
          filename = `cedulas_fusionadas_${ofertaId}.pdf`;
          method = 'post';
          break;
        default:
          return;
      }
      
      let response;
      if (method === 'post') {
        response = await api.post(url, {}, { responseType: 'blob' });
      } else {
        response = await api.get(url, { responseType: 'blob' });
      }
      
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      
      setSuccess(`✅ ${tipo.toUpperCase()} descargado correctamente`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error descargando documento:', error);
      setError(`Error al descargar ${tipo}: ${error.response?.status === 404 ? 'Archivo no disponible' : error.message}`);
      setTimeout(() => setError(''), 4000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No definida';
    const date = new Date(fecha);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${day}/${month}/${year}`;
  };

  const formatearFechaHora = (fecha) => {
    if (!fecha) return 'No definida';
    return new Date(fecha).toLocaleString('es-ES');
  };

  const calcularHorasReales = (oferta) => {
    if (!oferta.fechas?.inicio || !oferta.fechas?.fin) return 'N/A';
    if (oferta.es_campesena) {
      return oferta.programa_formacion?.duracion_maxima || 'N/A';
    }
    const { hora_inicio, hora_fin, dias } = oferta.horario || {};
    if (!hora_inicio || !hora_fin || !dias || dias.length === 0) {
      return oferta.programa_formacion?.duracion_maxima || 'N/A';
    }
    const [hI, mI] = hora_inicio.split(':').map(Number);
    const [hF, mF] = hora_fin.split(':').map(Number);
    const horasPorDia = (hF * 60 + mF - (hI * 60 + mI)) / 60;
    if (horasPorDia <= 0) return oferta.programa_formacion?.duracion_maxima || 'N/A';
    const inicio = new Date(oferta.fechas.inicio);
    const fin = new Date(oferta.fechas.fin);
    const inicioUTC = Date.UTC(inicio.getUTCFullYear(), inicio.getUTCMonth(), inicio.getUTCDate());
    const finUTC = Date.UTC(fin.getUTCFullYear(), fin.getUTCMonth(), fin.getUTCDate());
    const diffDays = Math.ceil((finUTC - inicioUTC) / (1000 * 60 * 60 * 24)) + 1;
    const diaMap = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0 };
    const diasNumeros = dias.map(d => diaMap[d]);
    let diasHabiles = 0;
    let current = new Date(inicioUTC);
    for (let i = 0; i < diffDays; i++) {
      const diaSemana = current.getUTCDay();
      if (diasNumeros.includes(diaSemana)) diasHabiles++;
      current.setUTCDate(current.getUTCDate() + 1);
    }
    return Math.round(diasHabiles * horasPorDia);
  };

  const calcularPorcentajeCupos = (disponibles, total) => {
    if (!total || total === 0) return 0;
    const ocupados = total - (disponibles || 0);
    return Math.round((ocupados / total) * 100);
  };

  const getEstadoColor = (estadoCodigo) => {
    switch (estadoCodigo) {
      case 'ficha_proceso_creacion': return 'text-orange-600 bg-orange-50';
      case 'ficha_creada': return 'text-blue-600 bg-blue-50';
      case 'validacion_instructor': return 'text-purple-600 bg-purple-50';
      case 'matriculados': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006c49] mx-auto mb-4"></div>
          <p className="text-[#45474c]">Cargando ofertas aprobadas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="fixed left-0 h-full w-64 bg-white border-r border-[#c5c6cd] flex flex-col p-4 z-40">
          <div className="mb-6 p-2">
            <h1 className="text-2xl font-black tracking-tight text-[#091426]">Gestionytics</h1>
            <p className="text-[10px] text-[#006c49] font-medium leading-tight mt-1 uppercase tracking-wider">Centro de Gestión de Datos SENA</p>
          </div>
          
          <nav className="flex-1 space-y-1">
            <button 
              onClick={() => setVistaActiva('ofertas')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                vistaActiva === 'ofertas'
                  ? 'bg-[#6cf8bb]/30 text-[#006c49] font-semibold'
                  : 'text-[#45474c] hover:bg-[#e5eeff]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">assignment_turned_in</span>
              <span className="text-sm font-medium">Ofertas Aprobadas</span>
            </button>
            <button 
              onClick={() => setVistaActiva('historial')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                vistaActiva === 'historial'
                  ? 'bg-[#6cf8bb]/30 text-[#006c49] font-semibold'
                  : 'text-[#45474c] hover:bg-[#e5eeff]'
              }`}
            >
              <span className="material-symbols-outlined text-xl">history</span>
              <span className="text-sm font-medium">Historial</span>
            </button>
          </nav>

          <div className="mt-auto">
            <div className="flex flex-col gap-2">
              <div className="p-3 bg-[#eff4ff] rounded-xl border border-[#c5c6cd]/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#006c49]/10 flex items-center justify-center text-[#006c49]">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs text-[#45474c] uppercase tracking-wider">Funcionario</span>
                  <span className="text-sm font-bold text-[#0b1c30] truncate">
                    {nombreFuncionario} {apellidoFuncionario}
                  </span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg border border-red-600/20 text-red-600 hover:bg-red-50 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                <span className="text-sm font-semibold">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-64 w-full min-h-screen overflow-y-auto bg-[#f8f9ff] p-8">
          <div className="max-w-6xl mx-auto">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-[#ffdad6] text-[#93000a] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 rounded-lg bg-[#6cf8bb]/30 text-[#005236] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span>{success}</span>
              </div>
            )}

            {/* Vista de Ofertas Aprobadas */}
            {vistaActiva === 'ofertas' && (
              <>
                <header className="mb-8">
                  <h1 className="text-4xl md:text-5xl font-bold text-[#0b1c30] mb-2">Ofertas Aprobadas</h1>
                  <p className="text-lg text-[#45474c] max-w-2xl">
                    Gestión de programas de formación aprobados para ejecución inmediata.
                  </p>
                </header>

                {ofertas.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl border border-[#c5c6cd]">
                    <p className="text-[#45474c]">No hay ofertas aprobadas para ti</p>
                    <p className="text-sm text-[#75777d] mt-2">Espera a que el coordinador asigne ofertas</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                    {ofertas.map((oferta) => {
                      const porcentajeCupos = calcularPorcentajeCupos(oferta.cupos_disponibles, oferta.cupo_maximo);
                      const estadoCodigo = oferta.estado?.codigo;
                      const estadoColor = getEstadoColor(estadoCodigo);
                      
                      return (
                        <div key={oferta._id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all border border-[#c5c6cd]/30 flex flex-col">
                          <div className="p-4 border-b bg-[#eff4ff]/30 border-[#c5c6cd]/20">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-lg font-semibold text-[#0b1c30] max-w-[70%]">{oferta.programa_formacion?.nombre_programa || 'Programa sin nombre'}</h3>
                              <span className={`px-2 py-0.5 text-xs font-bold rounded ${oferta.es_campesena ? 'bg-amber-600 text-white' : 'bg-[#006c49] text-white'}`}>
                                {oferta.es_campesena ? 'CAMPESENA' : 'REGULAR'}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-[#006c49]">Código: {oferta.programa_formacion?.codigo}</p>
                            {estadoCodigo && (
                              <div className="mt-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${estadoColor}`}>
                                  {oferta.estado?.nombre}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="p-4 flex-grow space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-[10px] text-[#45474c]">Instructor</p>
                                <p className="text-sm font-semibold">{oferta.creado_por?.nombre} {oferta.creado_por?.apellido || ''}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-[#45474c]">Empresa Solicitante</p>
                                <p className="text-sm font-semibold">{oferta.empresa_solicitante?.nombre || 'No especificada'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-sm text-[#75777d]">calendar_today</span>
                              <p className="text-xs">Inicia: {formatearFecha(oferta.fechas?.inicio)} - Finaliza: {formatearFecha(oferta.fechas?.fin)}</p>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="text-[#45474c]">Cupos asignados</span>
                                <span className="font-bold">{(oferta.cupo_maximo || 0) - (oferta.cupos_disponibles || 0)} / {oferta.cupo_maximo || 0}</span>
                              </div>
                              <div className="w-full h-1.5 bg-[#e5eeff] rounded-full overflow-hidden">
                                <div className="bg-[#006c49] h-full rounded-full" style={{ width: `${porcentajeCupos}%` }}></div>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 border-t border-[#c5c6cd] bg-white">
                            <button 
                              onClick={() => handleVerDetalles(oferta)}
                              className="w-full flex items-center justify-center gap-2 bg-[#006c49] text-white py-2 rounded-lg font-bold text-sm hover:bg-[#004a2b] transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">visibility</span>
                              Ver Detalles Completos
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Vista de Historial */}
            {vistaActiva === 'historial' && (
              <>
                <header className="mb-8">
                  <h1 className="text-4xl md:text-5xl font-bold text-[#0b1c30] mb-2">Historial de Fichas Creadas</h1>
                  <p className="text-lg text-[#45474c] max-w-2xl">Registro de todas las fichas técnicas creadas desde ofertas aprobadas.</p>
                </header>

                <div className="text-center py-16 bg-white rounded-xl border border-[#c5c6cd]">
                  <span className="material-symbols-outlined text-5xl text-[#75777d] mb-3">construction</span>
                  <p className="text-[#45474c]">Próximamente...</p>
                  <p className="text-sm text-[#75777d] mt-2">Esta funcionalidad estará disponible pronto.</p>
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modal con TODOS los detalles de la oferta */}
      {ofertaSeleccionada && !mostrarModalProceso && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 flex justify-between items-center p-4 border-b border-[#c5c6cd] bg-[#eff4ff] z-10">
              <div>
                <h3 className="text-xl font-semibold text-[#091426]">
                  Detalles de la Oferta
                </h3>
                <p className="text-xs text-[#006c49] mt-1">
                  {ofertaSeleccionada.programa_formacion?.nombre_programa} - {ofertaSeleccionada.programa_formacion?.codigo}
                </p>
              </div>
              <button 
                onClick={() => setOfertaSeleccionada(null)}
                className="p-2 hover:bg-[#dce9ff] rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {/* Modal Body - Datos de la Oferta */}
            <div className="p-6 space-y-6">
              {/* Sección 1: Información del Instructor */}
              <div className="bg-[#f8f9ff] p-4 rounded-lg border border-[#c5c6cd]">
                <h4 className="text-md font-bold text-[#006c49] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined">person</span> Información del Instructor
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-[#75777d]">Nombre del instructor</p>
                    <p className="text-sm font-medium">
                      {cargandoInstructor ? 'Cargando...' : (datosInstructor?.nombre || ofertaSeleccionada.creado_por?.nombre || 'No disponible')} 
                      {datosInstructor?.apellido || ofertaSeleccionada.creado_por?.apellido || ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Correo electrónico</p>
                    <p className="text-sm">
                      {cargandoInstructor ? 'Cargando...' : (datosInstructor?.correoElectronico || datosInstructor?.email || 'No disponible')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Celular</p>
                    <p className="text-sm">
                      {cargandoInstructor ? 'Cargando...' : (datosInstructor?.telefono || 'No disponible')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sección 2: Información del Programa */}
              <div className="bg-[#f8f9ff] p-4 rounded-lg border border-[#c5c6cd]">
                <h4 className="text-md font-bold text-[#006c49] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined">school</span> Información del Programa
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-[#75777d]">Nombre del programa</p>
                    <p className="text-sm font-medium">{ofertaSeleccionada.programa_formacion?.nombre_programa}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Código del programa</p>
                    <p className="text-sm">{ofertaSeleccionada.programa_formacion?.codigo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Versión del programa</p>
                    <p className="text-sm">{ofertaSeleccionada.programa_formacion?.version}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Sector del centro</p>
                    <p className="text-sm">Centro de Comercio y Servicios</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Programa especial</p>
                    <p className="text-sm">{ofertaSeleccionada.programa_especial?.nombre || 'Ninguno'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Cupo de aprendices</p>
                    <p className="text-sm font-bold">{ofertaSeleccionada.cupo_maximo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Tipo de oferta</p>
                    <p className="text-sm">{ofertaSeleccionada.tipo_oferta?.nombre}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Convenio</p>
                    <p className="text-sm">{ofertaSeleccionada.convenio?.nombre || 'No'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Coordinador</p>
                    <p className="text-sm">{ofertaSeleccionada.coordinador_asignado?.nombre || 'No asignado'}</p>
                  </div>
                </div>
              </div>

              {/* Sección 3: Información de la Empresa */}
              <div className="bg-[#f8f9ff] p-4 rounded-lg border border-[#c5c6cd]">
                <h4 className="text-md font-bold text-[#006c49] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined">business</span> Información de la Empresa
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-[#75777d]">Nombre de la empresa</p>
                    <p className="text-sm font-medium">
                      {cargandoEmpresa ? 'Cargando...' : (datosEmpresa?.nombre || ofertaSeleccionada.empresa_solicitante?.nombre || 'No especificada')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">NIT</p>
                    <p className="text-sm">{datosEmpresa?.nit || ofertaSeleccionada.empresa_solicitante?.nit || 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Fecha de creación</p>
                    <p className="text-sm">
                      {datosEmpresa?.fecha_creacion 
                        ? new Date(datosEmpresa.fecha_creacion).toLocaleDateString('es-ES') 
                        : 'No disponible'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Dirección</p>
                    <p className="text-sm">{datosEmpresa?.direccion || 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Tipo de empresa</p>
                    <p className="text-sm">{datosEmpresa?.tipo_empresa || 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Número de empleados</p>
                    <p className="text-sm">{datosEmpresa?.numero_empleados || 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Representante legal</p>
                    <p className="text-sm">{datosEmpresa?.representante_legal?.nombre_completo || 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Contacto en empresa</p>
                    <p className="text-sm">{datosEmpresa?.contacto?.nombre_completo || 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Teléfono del contacto</p>
                    <p className="text-sm">{datosEmpresa?.contacto?.telefono || 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Correo del contacto</p>
                    <p className="text-sm">{datosEmpresa?.contacto?.correo || 'No disponible'}</p>
                  </div>
                </div>
              </div>

              {/* Sección 4: Ubicación y Fechas */}
              <div className="bg-[#f8f9ff] p-4 rounded-lg border border-[#c5c6cd]">
                <h4 className="text-md font-bold text-[#006c49] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined">location_on</span> Ubicación y Fechas
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-[#75777d]">Municipio</p>
                    <p className="text-sm">{ofertaSeleccionada.ubicacion?.municipio?.nombre || 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Dirección</p>
                    <p className="text-sm">{ofertaSeleccionada.ubicacion?.direccion || 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Duración del programa</p>
                    <p className="text-sm font-semibold text-[#006c49]">
                      {ofertaSeleccionada.programa_formacion?.duracion_maxima || 
                      (ofertaSeleccionada.es_campesena ? 'Programación por instructor' : `${calcularHorasReales(ofertaSeleccionada)} horas`)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Fecha inicio</p>
                    <p className="text-sm font-medium">{formatearFecha(ofertaSeleccionada.fechas?.inicio)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#75777d]">Fecha fin</p>
                    <p className="text-sm font-medium">{formatearFecha(ofertaSeleccionada.fechas?.fin)}</p>
                  </div>
                  
                  {!ofertaSeleccionada.es_campesena && (
                    <>
                      <div>
                        <p className="text-xs text-[#75777d]">Horas por día</p>
                        <p className="text-sm">
                          {ofertaSeleccionada.horario?.hora_inicio && ofertaSeleccionada.horario?.hora_fin ? (
                            `${(() => {
                              const [hI, mI] = ofertaSeleccionada.horario.hora_inicio.split(':').map(Number);
                              const [hF, mF] = ofertaSeleccionada.horario.hora_fin.split(':').map(Number);
                              const horas = (hF * 60 + mF - (hI * 60 + mI)) / 60;
                              return `${horas} horas`;
                            })()}`
                          ) : 'No definido'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#75777d]">Días de clase</p>
                        <p className="text-sm">{ofertaSeleccionada.horario?.dias?.join(', ') || 'No definido'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#75777d]">Horario</p>
                        <p className="text-sm">
                          {ofertaSeleccionada.horario?.hora_inicio && ofertaSeleccionada.horario?.hora_fin ? (
                            `${ofertaSeleccionada.horario.hora_inicio} - ${ofertaSeleccionada.horario.hora_fin}`
                          ) : 'No definido'}
                        </p>
                      </div>
                    </>
                  )}
                  
                  {ofertaSeleccionada.es_campesena && (
                    <div className="md:col-span-3">
                      <div className="mt-2 p-2 bg-[#e5eeff] rounded-lg">
                        <p className="text-xs text-[#006c49] flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">info</span>
                          La programación de horarios se encuentra detallada en la sección de "Instructores Campesena"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección 5: Instructores Campesena */}
              {instructoresCampesena.length > 0 && (
                <div className="bg-[#f8f9ff] p-4 rounded-lg border border-[#c5c6cd]">
                  <h4 className="text-md font-bold text-[#006c49] mb-3 flex items-center gap-2">
                    <span className="material-symbols-outlined">groups</span> Instructores Campesena
                  </h4>
                  <div className="space-y-4">
                    {instructoresCampesena.map((instructor, idx) => (
                      <div key={instructor._id} className="bg-white rounded-lg border border-[#c5c6cd] overflow-hidden">
                        <div className={`px-4 py-2 ${idx === 0 ? 'bg-[#006c49]/10' : idx === 1 ? 'bg-[#6cf8bb]/20' : 'bg-amber-50'} border-b border-[#c5c6cd]`}>
                          <h5 className="font-semibold text-[#091426] flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">person</span>
                            Instructor {instructor.tipo}
                          </h5>
                        </div>
                        <div className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 pb-3 border-b border-[#c5c6cd]/30">
                            <div>
                              <p className="text-xs text-[#75777d]">Nombre completo</p>
                              <p className="text-sm font-medium">{instructor.nombre || 'No disponible'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-[#75777d]">Correo electrónico</p>
                              <p className="text-sm">{instructor.correo || 'No disponible'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-[#75777d]">Celular</p>
                              <p className="text-sm">{instructor.celular || 'No disponible'}</p>
                            </div>
                          </div>
                          
                          {instructor.programacion && instructor.programacion.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-[#006c49] mb-2">Programación Mensual</p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-[#eff4ff]">
                                      <th className="px-3 py-2 text-left text-xs">Mes</th>
                                      <th className="px-3 py-2 text-left text-xs">Fechas</th>
                                      <th className="px-3 py-2 text-left text-xs">Horario</th>
                                     </tr>
                                  </thead>
                                  <tbody>
                                    {instructor.programacion.map((mes, mIdx) => (
                                      <tr key={mIdx} className="border-b border-[#c5c6cd]/30">
                                        <td className="px-3 py-2 text-sm font-medium">Mes {mes.mes}</td>
                                        <td className="px-3 py-2 text-sm">
                                          {mes.rangos?.map((rango, rIdx) => (
                                            <div key={rIdx}>
                                              {rango.desde && rango.hasta 
                                                ? `${new Date(rango.desde).toLocaleDateString('es-ES')} - ${new Date(rango.hasta).toLocaleDateString('es-ES')}`
                                                : 'No definido'}
                                            </div>
                                          ))}
                                        </td>
                                        <td className="px-3 py-2 text-sm">
                                          {mes.rangos?.map((rango, rIdx) => (
                                            <div key={rIdx}>
                                              {rango.hora_inicio && rango.hora_fin 
                                                ? `${rango.hora_inicio} - ${rango.hora_fin}`
                                                : 'No definido'}
                                            </div>
                                          ))}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sección 6: Documentos */}
              <div className="bg-[#f8f9ff] p-4 rounded-lg border border-[#c5c6cd]">
                <h4 className="text-md font-bold text-[#006c49] mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined">description</span> Documentos
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#c5c6cd]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#ffdad6]/20 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#ba1a1a] text-sm">picture_as_pdf</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0b1c30]">Ficha de Caracterización</p>
                        <p className="text-xs text-[#75777d]">Formato oficial SENA (.pdf)</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => descargarDocumento(ofertaSeleccionada._id, 'ficha')}
                      className="flex items-center gap-1 px-3 py-1 bg-[#006c49] text-white rounded-lg text-xs hover:bg-[#004a2b] transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Descargar
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#c5c6cd]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1e293b]/10 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#1e293b] text-sm">description</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0b1c30]">Carta de Presentación</p>
                        <p className="text-xs text-[#75777d]">Firmada por representante legal</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => descargarDocumento(ofertaSeleccionada._id, 'carta')}
                      disabled={!ofertaSeleccionada.carta_pdf}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-colors ${
                        ofertaSeleccionada.carta_pdf 
                          ? 'bg-[#006c49] text-white hover:bg-[#004a2b]' 
                          : 'bg-[#e5eeff] text-[#75777d] cursor-not-allowed'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      {ofertaSeleccionada.carta_pdf ? 'Descargar' : 'No disponible'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#c5c6cd]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#6cf8bb]/20 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#006c49] text-sm">table_chart</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0b1c30]">Listado de Cédulas (Excel)</p>
                        <p className="text-xs text-[#75777d]">Consolidado de aprendices matriculados</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => descargarDocumento(ofertaSeleccionada._id, 'excel')}
                      disabled={inscritos.length === 0}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-colors ${
                        inscritos.length > 0 
                          ? 'bg-[#006c49] text-white hover:bg-[#004a2b]' 
                          : 'bg-[#e5eeff] text-[#75777d] cursor-not-allowed'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      {inscritos.length > 0 ? 'Descargar Excel' : 'Sin inscritos'}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#c5c6cd]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#ffdad6]/20 rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#ba1a1a] text-sm">folder_zip</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#0b1c30]">Cédulas Escaneadas (PDF)</p>
                        <p className="text-xs text-[#75777d]">Paquete de documentos de identidad fusionados</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => descargarDocumento(ofertaSeleccionada._id, 'cedulas')}
                      disabled={inscritos.length === 0}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-colors ${
                        inscritos.length > 0 
                          ? 'bg-[#006c49] text-white hover:bg-[#004a2b]' 
                          : 'bg-[#e5eeff] text-[#75777d] cursor-not-allowed'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      {inscritos.length > 0 ? 'Descargar PDF' : 'Sin cédulas'}
                    </button>
                  </div>
                </div>

                {inscritos.length === 0 && (
                  <div className="mt-3 text-center py-2 bg-[#eff4ff] rounded-lg">
                    <p className="text-xs text-[#45474c]">No hay inscritos para esta oferta aún.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="sticky bottom-0 p-4 border-t border-[#c5c6cd] bg-[#eff4ff] flex justify-end">
              <button 
                onClick={() => setOfertaSeleccionada(null)}
                className="px-4 py-2 bg-[#006c49] text-white rounded-lg text-sm font-medium hover:bg-[#004a2b] transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Proceso de Ficha */}
      {mostrarModalProceso && ofertaSeleccionada && resumenProceso && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#eff4ff] p-5 border-b border-[#c5c6cd]">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-[#091426]">
                    Proceso de Ficha - {ofertaSeleccionada.programa_formacion?.nombre_programa}
                  </h2>
                  <p className="text-sm text-[#45474c] mt-1">
                    Estado actual: <span className={`font-bold ${getEstadoColor(resumenProceso?.oferta?.estado_codigo)} px-2 py-0.5 rounded-full text-xs`}>
                      {resumenProceso?.oferta?.estado || ofertaSeleccionada.estado?.nombre || 'Sin estado'}
                    </span>
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setMostrarModalProceso(false);
                    setResumenProceso(null);
                    setArchivoSeleccionado(null);
                  }}
                  className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Timeline */}
              <div className="bg-white p-4 rounded-lg border border-[#c5c6cd]">
                <h3 className="text-md font-bold text-[#006c49] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined">timeline</span>
                  Línea de tiempo del proceso
                </h3>
                <div className="flex items-center justify-between">
                  {[
                    { paso: 1, label: 'Inicio Proceso', fecha: resumenProceso?.fechas?.inicio_proceso, estado: 'ficha_proceso_creacion' },
                    { paso: 2, label: 'Ficha Creada', fecha: resumenProceso?.fechas?.creacion_ficha, estado: 'ficha_creada' },
                    { paso: 3, label: 'Validación Instructor', fecha: resumenProceso?.fechas?.validacion_instructor, estado: 'validacion_instructor' },
                    { paso: 4, label: 'Matrícula Completada', fecha: resumenProceso?.fechas?.matricula_completada, estado: 'matriculados' }
                  ].map((item) => (
                    <div key={item.paso} className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        item.fecha ? 'bg-green-600' : 
                        resumenProceso?.oferta?.estado_codigo === item.estado ? 'bg-orange-600 animate-pulse' :
                        'bg-gray-300'
                      }`}>
                        {item.fecha ? '✓' : item.paso}
                      </div>
                      <p className="text-xs mt-2 text-center font-medium">{item.label}</p>
                      {item.fecha && (
                        <p className="text-[10px] text-gray-500">{formatearFecha(item.fecha)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-700">{resumenProceso?.inscritos?.total || 0}</p>
                  <p className="text-xs text-blue-600">Total Aspirantes</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-700">{resumenProceso?.validacion?.aprobados || 0}</p>
                  <p className="text-xs text-green-600">Aprobados</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-red-700">{resumenProceso?.validacion?.rechazados || 0}</p>
                  <p className="text-xs text-red-600">Rechazados</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-700">{resumenProceso?.validacion?.aprobados || 0}</p>
                  <p className="text-xs text-purple-600">Por Matricular</p>
                </div>
              </div>

              {/* Paso 1: Generar Excel */}
              {(!resumenProceso?.documentos?.tiene_excel_funcionario || resumenProceso?.oferta?.estado_codigo === 'ficha_proceso_creacion') && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined">file_download</span>
                    Paso 1: Generar y Subir Excel de Aspirantes
                  </h3>
                  <p className="text-sm text-orange-700 mb-3">
                    Genere el Excel masivo con todos los aspirantes para que el instructor valide quiénes pueden ser matriculados.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleGenerarExcel}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Generar Excel
                    </button>
                    
                    {!resumenProceso?.documentos?.tiene_excel_funcionario && (
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={(e) => setArchivoSeleccionado(e.target.files[0])}
                          className="text-sm"
                        />
                        <button
                          onClick={handleSubirExcel}
                          disabled={!archivoSeleccionado}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                        >
                          Subir Excel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {resumenProceso?.oferta?.estado_codigo === 'ficha_proceso_creacion' && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined">how_to_reg</span>
                    Matrícula Directa
                  </h3>
                  <p className="text-sm text-green-700 mb-3">
                    Si todos los aspirantes cumplen los requisitos, puede matricularlos directamente sin necesidad de validación del instructor.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Código de Ficha (opcional)
                      </label>
                      <input
                        type="text"
                        id="codigoFicha"
                        placeholder="Ej: 123456"
                        value={codigoFichaDirecto}
                        onChange={(e) => setCodigoFichaDirecto(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <textarea
                      id="observacionesDirectas"
                      placeholder="Observaciones sobre el proceso de matrícula (opcional)"
                      value={observacionesDirectas}
                      onChange={(e) => setObservacionesDirectas(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                      rows="2"
                    />
                    <button
                      onClick={handleMatricularDirecto}
                      className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Matricular Directamente
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 2: Esperando validación */}
              {resumenProceso?.documentos?.tiene_excel_funcionario && 
               !resumenProceso?.documentos?.tiene_excel_validado && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined">pending</span>
                    Paso 2: Esperando Validación del Instructor
                  </h3>
                  <p className="text-sm text-purple-700">
                    El Excel ha sido enviado al instructor. Él validará qué aspirantes pueden ser matriculados.
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-purple-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                    <span className="text-sm">En espera de respuesta del instructor...</span>
                  </div>
                </div>
              )}

              {/* Paso 3: Resultados de validación */}
              {resumenProceso?.documentos?.tiene_excel_validado && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined">assessment</span>
                    Paso 3: Resultados de Validación
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">
                    El instructor ha completado la validación.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={async () => {
                        try {
                          const response = await api.get(`/ficha/${ofertaSeleccionada._id}/descargar-excel-validado`, {
                            responseType: 'blob'
                          });
                          const url = window.URL.createObjectURL(new Blob([response.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `resultados_validacion_${ofertaSeleccionada.programa_formacion?.codigo || 'oferta'}.xlsx`);
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        } catch (error) {
                          console.error('Error:', error);
                          setError('Error al descargar resultados');
                        }
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      Descargar Resultados
                    </button>
                  </div>
                  
                  {resumenProceso?.lista_aprobados?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-green-700 mb-2">✅ Aspirantes aprobados ({resumenProceso.lista_aprobados.length})</p>
                      <div className="max-h-32 overflow-y-auto">
                        {resumenProceso.lista_aprobados.map((item, idx) => (
                          <p key={idx} className="text-xs text-green-600">{item.nombre} - {item.documento}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Paso 4: Confirmar matrícula */}
              {resumenProceso?.documentos?.tiene_excel_validado && 
               resumenProceso?.oferta?.estado_codigo !== 'matriculados' && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="font-bold text-green-800 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined">how_to_reg</span>
                    Paso 4: Confirmar Matrícula
                  </h3>
                  <p className="text-sm text-green-700 mb-3">
                    Una vez haya realizado la matrícula de los aspirantes aprobados, confirme la finalización.
                  </p>
                  <textarea
                    value={observacionesMatricula}
                    onChange={(e) => setObservacionesMatricula(e.target.value)}
                    placeholder="Observaciones sobre el proceso de matrícula (opcional)"
                    className="w-full p-2 border border-green-300 rounded-lg text-sm mb-3"
                    rows="2"
                  />
                  <button
                    onClick={handleConfirmarMatricula}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Confirmar Matrícula Completada
                  </button>
                </div>
              )}

              {/* Proceso completado */}
              {resumenProceso?.oferta?.estado_codigo === 'matriculados' && (
                <div className="bg-green-100 p-4 rounded-lg border-2 border-green-400">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-2xl">celebration</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-green-800 text-lg">¡Proceso Completado!</h3>
                      <p className="text-sm text-green-700">
                        Ficha matriculada el {formatearFechaHora(resumenProceso?.fechas?.matricula_completada)}
                      </p>
                      {resumenProceso?.observaciones && (
                        <p className="text-xs text-green-600 mt-1">Observaciones: {resumenProceso.observaciones}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-[#f8f9ff] border-t p-4 flex justify-end">
              <button
                onClick={() => {
                  setMostrarModalProceso(false);
                  setResumenProceso(null);
                }}
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

export default FuncionarioDashboard;