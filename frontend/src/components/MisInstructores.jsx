import React, { useState, useEffect } from 'react';
import api from '../services/api';

const MisInstructores = () => {
  const [instructores, setInstructores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    cargarInstructores();
  }, []);

  const cargarInstructores = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const coordinadorId = user.id;
      
      console.log('Buscando instructores para coordinador:', coordinadorId);
      
      const response = await api.get(`/usuarios/coordinador/${coordinadorId}/instructores`);
      
      console.log('Respuesta:', response.data);
      setInstructores(response.data.data || []);
      
    } catch (error) {
      console.error('Error cargando instructores:', error);
      if (error.response?.status === 401) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
      } else {
        setError('Error al cargar la lista de instructores');
      }
    } finally {
      setLoading(false);
    }
  };

  const verOfertas = (instructorId) => {
    window.location.href = `/dashboard?instructor=${instructorId}`;
  };

  // Filtrar instructores
  const instructoresFiltrados = instructores.filter(instructor => {
    const nombreCompleto = `${instructor.nombre} ${instructor.apellido}`.toLowerCase();
    const busqueda = filtroBusqueda.toLowerCase();
    const coincideBusqueda = nombreCompleto.includes(busqueda) || 
                              (instructor.correoElectronico || '').toLowerCase().includes(busqueda);
    
    // Por ahora todos están activos, filtro por estado para futura implementación
    if (filtroEstado === 'todos') return coincideBusqueda;
    return coincideBusqueda;
  });

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#006c49] mx-auto mb-4"></div>
          <p className="text-[#45474c]">Cargando instructores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-semibold text-[#091426]">Mis Instructores Asignados</h2>
          <p className="text-base text-[#45474c] mt-1">Gestión y seguimiento de los profesionales académicos bajo su coordinación.</p>
        </div>
        
        {/* Summary Card */}
        <div className="bg-white border border-[#c5c6cd] rounded-xl px-5 py-3 shadow-sm flex items-center gap-3">
          <div className="bg-[#6cf8bb]/30 p-2 rounded-lg">
            <span className="material-symbols-outlined text-[#005236]">groups</span>
          </div>
          <div>
            <p className="text-[#45474c] text-xs uppercase tracking-wider">Total Instructores</p>
            <p className="text-[#091426] text-3xl font-semibold">{instructoresFiltrados.length}</p>
          </div>
        </div>
      </section>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-[#ffdad6] text-[#93000a] flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Filters Section */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="bg-white border border-[#c5c6cd] px-3 py-1.5 rounded-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-[#45474c] text-sm">filter_list</span>
          <span className="text-sm text-[#45474c]">Filtrar por:</span>
          <select 
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-[#006c49] cursor-pointer"
          >
            <option value="todos">Todos los estados</option>
            <option value="activos">Activos</option>
            <option value="pendientes">Pendientes</option>
          </select>
        </div>
        
        <div className="flex items-center bg-white border border-[#c5c6cd] rounded-lg px-3 py-1.5 flex-1 max-w-md">
          <span className="material-symbols-outlined text-[#45474c] text-sm">search</span>
          <input 
            type="text"
            value={filtroBusqueda}
            onChange={(e) => setFiltroBusqueda(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-sm w-full text-[#0b1c30] placeholder:text-[#45474c]/60 pl-2"
            placeholder="Buscar instructor por nombre o email..."
          />
        </div>
      </div>

      {/* Empty State */}
      {instructoresFiltrados.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white rounded-2xl border-2 border-dashed border-[#c5c6cd]">
          <div className="relative w-40 h-40 mb-6">
            <img 
              alt="Ilustración de estado vacío" 
              className="w-full h-full object-contain opacity-50"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6T9a5Wm2dsFsXbXu4SSgKLh7oY8s9_TKwOIyFm7c_loyfb4dPgy3bWNsEI15oW-QGlPPVOc0ijg8iWr4YsVn2w7RgccV6vSEZcw0mIXReIuTBQv27R1FZWrWK8z4pBJIVyr-5vaONnHEiEXvQKIXoMqUm7X5hwmdVy4p2bobtA0pgGDZgakri1c5YVWzzNvwjZCPZ9B0NUaff8rFYElcAsaAbbZ7SVodPndRnoprPPea0UDoDL-WYHT4dGcRbhO8CDtxj3EII8ys"
            />
          </div>
          <h3 className="text-2xl font-semibold text-[#091426] mb-2">No se encontraron instructores</h3>
          <p className="text-base text-[#45474c] max-w-md mx-auto">
            Aún no has vinculado instructores a tu coordinación o los criterios de búsqueda no coinciden.
          </p>
        </div>
      )}

      {/* Instructor Grid */}
      {instructoresFiltrados.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {instructoresFiltrados.map((instructor) => (
            <div key={instructor._id} className="bg-white rounded-xl border border-[#c5c6cd] flex flex-col p-5 transition-all hover:-translate-y-1 hover:shadow-md duration-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3 items-center">
                  <div className="h-12 w-12 rounded-full bg-[#d8e3fb] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#091426]">person</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#091426]">{instructor.nombre} {instructor.apellido}</h3>
                    <span className="bg-[#6cf8bb]/30 text-[#005236] text-xs font-medium px-2 py-0.5 rounded">Instructor</span>
                  </div>
                </div>
                <button className="text-[#45474c] hover:text-[#006c49]">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
              
              <div className="space-y-2 flex-grow">
                <div className="flex items-center gap-2 text-[#45474c]">
                  <span className="material-symbols-outlined text-sm">mail</span>
                  <span className="text-sm">{instructor.correoElectronico}</span>
                </div>
                <div className="flex items-center gap-2 text-[#45474c]">
                  <span className="material-symbols-outlined text-sm">smartphone</span>
                  <span className="text-sm">{instructor.telefono || 'No registrado'}</span>
                </div>
                
                <div className="mt-3 pt-3 border-t border-[#c5c6cd] grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[#75777d] text-[10px] uppercase tracking-wider">Usuario</p>
                    <p className="text-sm font-medium text-[#006c49]">{instructor.nombreUsuario}</p>
                  </div>
                  <div>
                    <p className="text-[#75777d] text-[10px] uppercase tracking-wider">Documento</p>
                    <p className="text-sm font-medium text-[#006c49]">{instructor.numeroIdentificacion}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-[#75777d] mt-2">
                  <span className="material-symbols-outlined text-sm">calendar_today</span>
                  <span className="text-xs">Registrado el {formatearFecha(instructor.createdAt)}</span>
                </div>
              </div>
              
              <button 
                onClick={() => verOfertas(instructor._id)}
                className="mt-4 w-full bg-white border border-[#006c49] text-[#006c49] hover:bg-[#006c49] hover:text-white transition-all text-sm font-medium py-2 rounded-lg flex items-center justify-center gap-2"
              >
                Ver ofertas
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default MisInstructores;