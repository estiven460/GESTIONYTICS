// frontend/src/components/ValidarAspirantes.jsx
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const ValidarAspirantes = () => {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    cargarOfertasParaValidar();
  }, []);

  const cargarOfertasParaValidar = async () => {
    try {
      setLoading(true);
      // Obtener todas las ofertas del instructor
      const response = await api.get('/ofertas/mis-ofertas');
      // Filtrar las que están en estado "ficha_creada" (esperando validación)
      const ofertasFiltradas = (response.data.data || []).filter(oferta => {
        const historialAdmin = oferta.historial_administrativo || [];
        const ultimoEstado = historialAdmin.length > 0 ? historialAdmin[historialAdmin.length - 1].estado : null;
        return ultimoEstado === 'ficha_creada';
      });
      setOfertas(ofertasFiltradas);
    } catch (error) {
      console.error('Error cargando ofertas:', error);
      setError('Error al cargar las ofertas para validar');
    } finally {
      setLoading(false);
    }
  };

  const descargarExcelParaValidar = async (ofertaId) => {
    try {
      const response = await api.get(`/ficha/${ofertaId}/descargar-para-validar`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `validar_aspirantes_${ofertaId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccess('✅ Excel descargado correctamente');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error descargando Excel:', error);
      setError('Error al descargar el Excel');
    }
  };

  const subirExcelValidado = async () => {
    if (!ofertaSeleccionada || !archivoSeleccionado) {
      setError('Debe seleccionar una oferta y un archivo Excel');
      return;
    }

    const formData = new FormData();
    formData.append('excel', archivoSeleccionado);

    try {
      const response = await api.post(`/ficha/${ofertaSeleccionada._id}/subir-validado`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess(response.data.message);
      setMostrarModal(false);
      setOfertaSeleccionada(null);
      setArchivoSeleccionado(null);
      cargarOfertasParaValidar(); // Recargar la lista
      
    } catch (error) {
      console.error('Error subiendo Excel validado:', error);
      setError(error.response?.data?.message || 'Error al subir el Excel validado');
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'No definida';
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006c49] mx-auto mb-4"></div>
          <p className="text-[#45474c]">Cargando ofertas para validar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold text-[#091426] mb-2">Validar Aspirantes</h1>
        <p className="text-[#45474c] text-base">Descargue el Excel, valide los aspirantes y súbalo nuevamente al sistema.</p>
      </div>

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

      {ofertas.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-[#c5c6cd]">
          <span className="material-symbols-outlined text-5xl text-[#75777d] mb-3">fact_check</span>
          <p className="text-[#45474c]">No hay ofertas pendientes de validación</p>
          <p className="text-sm text-[#75777d] mt-2">Cuando el funcionario cree una ficha, aparecerá aquí</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ofertas.map((oferta) => {
            const historialAdmin = oferta.historial_administrativo || [];
            const ultimoEstado = historialAdmin.length > 0 ? historialAdmin[historialAdmin.length - 1].estado : null;
            
            return (
              <div key={oferta._id} className="bg-white rounded-xl shadow-sm border border-[#c5c6cd]/30 overflow-hidden">
                <div className="p-4 border-b bg-blue-50/30">
                  <h3 className="text-lg font-semibold text-[#091426]">{oferta.programa_formacion?.nombre_programa}</h3>
                  <p className="text-xs text-[#006c49]">Código: {oferta.programa_formacion?.codigo}</p>
                  <div className="mt-2">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Estado: Esperando validación
                    </span>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#45474c]">Instructor:</span>
                    <span className="font-medium">{oferta.creado_por?.nombre} {oferta.creado_por?.apellido}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#45474c]">Cupos:</span>
                    <span className="font-medium">{oferta.cupos_disponibles || 0}/{oferta.cupo_maximo}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#45474c]">Fechas:</span>
                    <span className="font-medium">{formatearFecha(oferta.fechas?.inicio)} - {formatearFecha(oferta.fechas?.fin)}</span>
                  </div>
                </div>
                
                <div className="p-4 bg-[#f8f9ff] border-t border-[#c5c6cd]/30 flex gap-2">
                  <button
                    onClick={() => descargarExcelParaValidar(oferta._id)}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Descargar Excel
                  </button>
                  <button
                    onClick={() => {
                      setOfertaSeleccionada(oferta);
                      setMostrarModal(true);
                    }}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">upload</span>
                    Subir Validado
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para subir Excel validado */}
      {mostrarModal && ofertaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="bg-green-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined">upload_file</span>
                <h2 className="text-xl font-semibold">Subir Excel Validado</h2>
              </div>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-800">Programa:</p>
                <p className="text-sm">{ofertaSeleccionada.programa_formacion?.nombre_programa}</p>
                <p className="text-xs text-blue-600 mt-1">Código: {ofertaSeleccionada.programa_formacion?.codigo}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#091426] mb-2">
                  Archivo Excel validado (con columna ¿Aprueba? = SÍ/NO)
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setArchivoSeleccionado(e.target.files[0])}
                  className="w-full p-2 border border-[#c5c6cd] rounded-lg"
                />
                <p className="text-xs text-[#75777d] mt-1">
                  El Excel debe tener la columna "¿Aprueba?" con valores "SÍ" o "NO"
                </p>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-yellow-600 text-sm">info</span>
                  <p className="text-xs text-yellow-800">
                    Al subir este archivo, los aspirantes marcados como "SÍ" serán aprobados para matrícula.
                    Los marcados como "NO" serán rechazados.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-[#f8f9ff] border-t flex justify-end gap-3">
              <button
                onClick={() => {
                  setMostrarModal(false);
                  setOfertaSeleccionada(null);
                  setArchivoSeleccionado(null);
                }}
                className="px-4 py-2 text-[#45474c] hover:bg-[#e5eeff] rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={subirExcelValidado}
                disabled={!archivoSeleccionado}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                Subir Validación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidarAspirantes;