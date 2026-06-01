import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Registro = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [coordinadores, setCoordinadores] = useState([]);
  
  const [formData, setFormData] = useState({
    nombreUsuario: '',
    tipoIdentificacion: '',
    numeroIdentificacion: '',
    nombre: '',
    apellido: '',
    telefono: '',
    correoElectronico: '',
    coordinadorAsignado: '',
    password: '',
    confirmPassword: ''
  });

  // Cargar tipos de documento y coordinadores
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      const [tiposRes, coordinadoresRes] = await Promise.all([
        api.get('/tipos-documento'),
        api.get('/coordinadores')
      ]);

      setTiposDocumento(tiposRes.data.data || []);
      setCoordinadores(coordinadoresRes.data.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validaciones
      if (!formData.nombreUsuario) throw new Error('El nombre de usuario es obligatorio');
      if (!formData.tipoIdentificacion) throw new Error('Seleccione un tipo de identificación');
      if (!formData.numeroIdentificacion) throw new Error('El número de identificación es obligatorio');
      if (!formData.nombre) throw new Error('El nombre es obligatorio');
      if (!formData.apellido) throw new Error('El apellido es obligatorio');
      if (!formData.telefono) throw new Error('El teléfono es obligatorio');
      if (!formData.correoElectronico) throw new Error('El correo es obligatorio');
      if (!formData.coordinadorAsignado) throw new Error('Seleccione un coordinador');
      if (!formData.password) throw new Error('La contraseña es obligatoria');
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }
      if (formData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Validar email
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(formData.correoElectronico)) {
        throw new Error('Correo electrónico inválido');
      }

      // Crear objeto para enviar (sin confirmPassword)
      const { confirmPassword, ...datosEnvio } = formData;

      // Enviar al backend
      const response = await api.post('/auth/register', datosEnvio);
      
      setSuccess('¡Registro exitoso! Redirigiendo al login...');
      
      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-[800px] bg-white border border-[#c5c6cd]/30 rounded-xl overflow-hidden shadow-sm">
        {/* Card Header */}
        <div className="p-8 md:p-12 text-center border-b border-[#d3e4fe]/50">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-xl flex items-center justify-center">
              <img
                src="/logosena.png"
                alt="Logo SENA"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold text-[#39A900]">Registro</h1>
        </div>

        {/* Registration Form */}
        <form className="p-8 md:p-12 space-y-10" onSubmit={handleSubmit}>
          {/* Section: Información de Cuenta */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-[#39A900]">lock_person</span>
              <h2 className="text-2xl font-semibold text-[#39A900]">Información de Cuenta</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#0b1c30]">
                  Nombre de Usuario <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  name="nombreUsuario"
                  value={formData.nombreUsuario}
                  onChange={handleChange}
                  className="h-11 px-4 rounded-lg border border-[#c5c6cd] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-transparent transition-all"
                  placeholder="p. ej. jdoe_admin"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#0b1c30]">
                  Correo Electrónico <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="email"
                  name="correoElectronico"
                  value={formData.correoElectronico}
                  onChange={handleChange}
                  className="h-11 px-4 rounded-lg border border-[#c5c6cd] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-transparent transition-all"
                  placeholder="correo@ejemplo.com"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#0b1c30]">
                  Contraseña <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="h-11 px-4 rounded-lg border border-[#c5c6cd] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#0b1c30]">
                  Confirmar Contraseña <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="h-11 px-4 rounded-lg border border-[#c5c6cd] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          </section>

          {/* Section: Datos Personales */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-[#39A900]">badge</span>
              <h2 className="text-2xl font-semibold text-[#39A900]">Datos Personales</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#0b1c30]">
                  Tipo de Identificación <span className="text-[#ba1a1a]">*</span>
                </label>
                <select
                  name="tipoIdentificacion"
                  value={formData.tipoIdentificacion}
                  onChange={handleChange}
                  className="h-11 px-4 rounded-lg border border-[#c5c6cd] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-transparent transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {tiposDocumento.map(tipo => (
                    <option key={tipo._id} value={tipo._id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#0b1c30]">
                  Número de Identificación <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  name="numeroIdentificacion"
                  value={formData.numeroIdentificacion}
                  onChange={handleChange}
                  className="h-11 px-4 rounded-lg border border-[#c5c6cd] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-transparent transition-all"
                  placeholder="12345678"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#0b1c30]">
                  Nombres <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="h-11 px-4 rounded-lg border border-[#c5c6cd] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-transparent transition-all"
                  placeholder="Juan Camilo"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#0b1c30]">
                  Apellidos <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  className="h-11 px-4 rounded-lg border border-[#c5c6cd] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-transparent transition-all"
                  placeholder="Pérez Rodríguez"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#0b1c30]">Teléfono</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="h-11 px-4 rounded-lg border border-[#c5c6cd] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-transparent transition-all"
                  placeholder="+57 300 000 0000"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-[#0b1c30]">
                  Coordinador Asignado <span className="text-[#ba1a1a]">*</span>
                </label>
                <select
                  name="coordinadorAsignado"
                  value={formData.coordinadorAsignado}
                  onChange={handleChange}
                  className="h-11 px-4 rounded-lg border border-[#c5c6cd] bg-white text-base focus:outline-none focus:ring-2 focus:ring-[#39A900] focus:border-transparent transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat"
                  required
                >
                  <option value="">Seleccionar coordinador...</option>
                  {coordinadores.map(coord => (
                    <option key={coord._id} value={coord._id}>
                      {coord.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Feedback States */}
          {error && (
            <div className="p-4 rounded-lg bg-[#ffdad6] text-[#93000a] flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              <span className="text-sm">{error}</span>
            </div>
          )}
          {success && (
            <div className="p-4 rounded-lg bg-[#e6f4ea] text-[#002100] flex items-center gap-3">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-6 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-[#d3e4fe]/50">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-[#45474c] text-sm font-medium hover:text-[#39A900] transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Volver al Login
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-10 h-12 bg-[#39A900] text-white rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">progress_activity</span>
                  Procesando...
                </>
              ) : (
                <>
                  Registrarse
                  <span className="material-symbols-outlined">how_to_reg</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Registro;