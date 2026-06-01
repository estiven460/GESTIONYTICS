import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import CrearOferta from './components/CrearOferta';
import SolicitarOferta from './components/SolicitarOferta';
import LinksInscripcion from './components/LinksInscripcion';
import FormularioInscripcion from './components/FormularioInscripcion';
import { authService } from './services/api';
import Registro from './components/Registro';
import VerInscritos from './components/VerInscritos';
import MisInstructores from './components/MisInstructores';
import SolicitudesPendientes from './components/SolicitudesPendientes';
import MisOfertas from './components/MisOfertas';
import FuncionarioDashboard from './components/FuncionarioDashboard';
import ValidarAspirantes from './components/ValidarAspirantes';

// ===== COMPONENTE PARA SELECCIONAR TIPO DE OFERTA (ESTILO BENTO) =====
const SeleccionarTipoOferta = ({ onSeleccionar }) => {
  const user = authService.getCurrentUser();
  const userTipo = user?.tipo || 'instructor';
  
  return (
    <div className="max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-[#0b1c30] mb-2">Crear Oferta</h1>
        <p className="text-lg text-[#45474c] max-w-2xl">
          Selecciona el tipo de oferta que deseas crear.
        </p>
      </div>

      {/* Bento-Style Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card: REGULAR */}
        <div 
          onClick={() => onSeleccionar('regular')}
          className="group relative overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer border border-[#c5c6cd]/30 flex flex-col h-[400px]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#006c49]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="h-48 relative overflow-hidden bg-[#6cf8bb]/20 flex items-center justify-center border-b border-[#c5c6cd]/20">
            <span className="material-symbols-outlined text-[96px] text-[#006c49] group-hover:scale-110 transition-transform duration-500">
              corporate_fare
            </span>
            <div className="absolute top-4 right-4 bg-[#006c49] text-white px-4 py-1 rounded-full text-xs font-medium shadow-lg">
              Institucional
            </div>
          </div>
          
          <div className="p-6 flex flex-col flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-[#006c49]/10 flex items-center justify-center text-[#006c49]">
                <span className="material-symbols-outlined text-3xl">apartment</span>
              </div>
              <h2 className="text-3xl font-semibold text-[#006c49]">REGULAR</h2>
            </div>
            
            <div className="mt-4 flex items-center gap-2 text-[#006c49] font-bold">
              <span className="text-sm">SELECCIONAR PROGRAMA</span>
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
            </div>
          </div>
        </div>

        {/* Card: CAMPESENA */}
        <div 
          onClick={() => onSeleccionar('campesena')}
          className="group relative overflow-hidden rounded-xl bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer border border-[#c5c6cd]/30 flex flex-col h-[400px]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="h-48 relative overflow-hidden bg-amber-50 flex items-center justify-center border-b border-[#c5c6cd]/20">
            <span className="material-symbols-outlined text-[96px] text-amber-600 group-hover:scale-110 transition-transform duration-500">
              agriculture
            </span>
            <div className="absolute top-4 right-4 bg-amber-600 text-white px-4 py-1 rounded-full text-xs font-medium shadow-lg">
              Rural 
            </div>
          </div>
          
          <div className="p-6 flex flex-col flex-1">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                <span className="material-symbols-outlined text-3xl">agriculture</span>
              </div>
              <h2 className="text-3xl font-semibold text-amber-700">CAMPESENA</h2>
            </div>
          
            <div className="mt-4 flex items-center gap-2 text-amber-700 font-bold">
              <span className="text-sm">SELECCIONAR PROGRAMA</span>
              <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard con dos columnas
const Dashboard = () => {
  const user = authService.getCurrentUser();
  const userTipo = user?.tipo || 'instructor';
  
  const [vistaActiva, setVistaActiva] = useState(() => {
    if (userTipo === 'coordinador') return 'solicitudes';
    if (userTipo === 'instructor') return 'crear';
    return 'crear';
  });
  const [modoCrearOferta, setModoCrearOferta] = useState(null);
  
  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  const handleSeleccionarModo = (modo) => {
    setModoCrearOferta(modo);
  };

  const handleVolverAlSelector = () => {
    setModoCrearOferta(null);
  };

  const menuItems = [
    { id: 'crear', icon: 'add_circle', label: 'Crear Oferta', roles: ['instructor'] },
    { id: 'misofertas', icon: 'inventory', label: 'Mis Ofertas', roles: ['instructor'] },
    { id: 'solicitar', icon: 'forward_to_inbox', label: 'Enviar Oferta', roles: ['instructor'] },
    { id: 'links', icon: 'share', label: 'Links de Inscripción', roles: ['instructor'] },
    { id: 'inscritos', icon: 'person_search', label: 'Ver Inscritos', roles: ['instructor'] },
    { id: 'validar_aspirantes', icon: 'fact_check', label: 'Validar Aspirantes', roles: ['instructor'] },
    { id: 'solicitudes', icon: 'check_circle', label: 'Solicitudes de Validación', roles: ['coordinador'] },
    { id: 'instructores', icon: 'group', label: 'Mis Instructores', roles: ['coordinador'] }
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(userTipo));

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
            {visibleMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setVistaActiva(item.id);
                  if (item.id === 'crear') setModoCrearOferta(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  vistaActiva === item.id
                    ? 'bg-[#6cf8bb]/30 text-[#006c49] font-semibold'
                    : 'text-[#45474c] hover:bg-[#e5eeff]'
                }`}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto">
            <div className="flex flex-col gap-2">
              <div className="p-3 bg-[#eff4ff] rounded-xl border border-[#c5c6cd]/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#006c49]/10 flex items-center justify-center text-[#006c49]">
                  <span className="material-symbols-outlined text-2xl">person</span>
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs text-[#45474c] uppercase tracking-wider">{userTipo}</span>
                  <span className="text-sm font-bold text-[#0b1c30] truncate">
                    {user?.nombre} {user?.apellido}
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
            {vistaActiva === 'crear' && (
              modoCrearOferta === null ? (
                <SeleccionarTipoOferta onSeleccionar={handleSeleccionarModo} />
              ) : (
                <CrearOferta modo={modoCrearOferta} onVolverAlSelector={handleVolverAlSelector} />
              )
            )}
            {vistaActiva === 'misofertas' && <MisOfertas />}
            {vistaActiva === 'solicitar' && <SolicitarOferta />}
            {vistaActiva === 'links' && <LinksInscripcion />}
            {vistaActiva === 'inscritos' && <VerInscritos />}
            {vistaActiva === 'validar_aspirantes' && <ValidarAspirantes />}
            {vistaActiva === 'solicitudes' && <SolicitudesPendientes />}
            {vistaActiva === 'instructores' && <MisInstructores />}
          </div>
        </main>
      </div>
    </div>
  );
};

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/inscribirse/:codigo" element={<FormularioInscripcion />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/funcionario" element={<ProtectedRoute><FuncionarioDashboard /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;