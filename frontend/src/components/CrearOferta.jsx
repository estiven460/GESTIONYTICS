import React, { useState, useEffect } from 'react';
import api from '../services/api';
import FormularioCampesenaCompleto from './FormularioCampesenaCompleto';
import Swal from 'sweetalert2';

const CrearOferta = ({ modo, onVolverAlSelector }) => {
  // ===== ESTADOS PRINCIPALES =====
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mostrarFormularioEmpresa, setMostrarFormularioEmpresa] = useState(false);
  const [instructoresVisibles, setInstructoresVisibles] = useState({
    primerInstructor: '',
    segundoInstructor: ''
  });

  // ===== NUEVO: Estado para paso actual del stepper =====
  const [pasoActual, setPasoActual] = useState(1);

  // ===== NUEVO: Estado para guardar los IDs de Regular y Campesena =====
  const [tiposProgramaIds, setTiposProgramaIds] = useState({
    regular: '',
    campesena: ''
  });

  // ===== ESTADO DEL FORMULARIO BASE =====
  const [formData, setFormData] = useState({
    programa_formacion: '',
    modalidad: '',
    tipo_oferta: '',
    cupo_maximo: '',
    ambiente: {
      nombre: ''
    },
    fechas: {
      inicio: '',
      fin: ''
    },
    ubicacion: {
      departamento: 'Cauca',
      municipio: '',
      direccion: ''
    },
    empresa_solicitante: '',
    subsector_economico: {
      nombre: ''
    },
    programa_especial: '',
    convenio: {
      nombre: ''
    },
    horario: {
      hora_inicio: '08:00',
      hora_fin: '12:00',
      dias: []
    },
    firma_digital_pdf: null,
    carta_pdf: null
  });

  // ===== ESTADOS PARA SELECTS =====
  const [programas, setProgramas] = useState([]);
  const [modalidades, setModalidades] = useState([]);
  const [tiposPrograma, setTiposPrograma] = useState([]);
  const [tiposOferta, setTiposOferta] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [programasEspeciales, setProgramasEspeciales] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  // ===== FILTROS PARA PROGRAMA DE FORMACIÓN =====
  const [filtroPrograma, setFiltroPrograma] = useState('');
  const [filtroHoras, setFiltroHoras] = useState('');

  // ===== ESTADO PARA SELECT DE MUNICIPIO CON BÚSQUEDA =====
  const [municipioAbierto, setMunicipioAbierto] = useState(false);
  const [busquedaMunicipio, setBusquedaMunicipio] = useState('');


  // ===== ESTADO PARA USUARIO AUTENTICADO (CAMPESENA) =====
  const [usuarioActual, setUsuarioActual] = useState(null);

  // ===== ESTADOS DE CÁLCULO DE FECHA FIN =====
  const [horasPrograma, setHorasPrograma] = useState(0);
  const [fechasFinModificada, setFechasFinModificada] = useState(false);

  // ===== ESTADO PARA NUEVA EMPRESA =====
  const [nuevaEmpresa, setNuevaEmpresa] = useState({
    nombre: '',
    nit: '',
    fecha_creacion: '',
    tipo_empresa: 'Privada',
    direccion: '',
    representante_legal: {
      nombre_completo: '',
      documento_identidad: '',
      telefono: '',
      correo: ''
    },
    contacto: {
      nombre_completo: '',
      cargo: '',
      telefono: '',
      correo: ''
    },
    numero_empleados: ''
  });

  // Convierte "YYYY-MM-DD" a Date en hora local (00:00:00 local)
  const parseLocalDate = (fechaStr) => {
    if (!fechaStr) return null;
    const [year, month, day] = fechaStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // ===== CARGAR DATOS INICIALES =====
  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (municipioAbierto && !e.target.closest('.custom-select-container')) {
        setMunicipioAbierto(false);
        setBusquedaMunicipio('');
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [municipioAbierto]);

  const cargarDatosIniciales = async () => {
    try {
      const [
        programasRes,
        modalidadesRes,
        tiposProgramaRes,
        tiposOfertaRes,
        municipiosRes,
        programasEspecialesRes,
        empresasRes
      ] = await Promise.all([
        api.get('/programas-formacion'),
        api.get('/modalidades'),
        api.get('/tipos-programa'),
        api.get('/tipos-oferta'),
        api.get('/municipios'),
        api.get('/programas-especiales'),
        api.get('/empresas')
      ]);

      setProgramas(programasRes.data.data || []);
      setModalidades(modalidadesRes.data.data || []);
      setTiposPrograma(tiposProgramaRes.data.data || []);
      setTiposOferta(tiposOfertaRes.data.data || []);
      setMunicipios(municipiosRes.data.data || []);
      setProgramasEspeciales(programasEspecialesRes.data.data || []);
      setEmpresas(empresasRes.data.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de carga',
        text: 'No se pudieron cargar los datos iniciales',
        timer: 3000,
        showConfirmButton: false
      });
    }
  };

  // ===== Cuando se cargan los tipos de programa, guardamos los IDs =====
  useEffect(() => {
    if (tiposPrograma.length > 0) {
      const regular = tiposPrograma.find(t => t.nombre === 'Regular');
      const campesena = tiposPrograma.find(t => t.nombre === 'Campesena');

      setTiposProgramaIds({
        regular: regular?._id || '',
        campesena: campesena?._id || ''
      });

      console.log('✅ IDs cargados:', {
        regular: regular?._id,
        campesena: campesena?._id
      });
    }
  }, [tiposPrograma]);

  useEffect(() => {
    const programaSel = programas.find(p => p._id === formData.programa_formacion);
    if (programaSel && programaSel.duracion_maxima) {
      setHorasPrograma(programaSel.duracion_maxima);
    } else {
      setHorasPrograma(0);
    }
  }, [formData.programa_formacion, programas]);

  // Calcula horas totales disponibles entre dos fechas según días y horario
  const calcularHorasEnRango = (fechaInicio, fechaFin, diasSeleccionados, horaInicio, horaFin) => {
    if (!fechaInicio || !fechaFin || diasSeleccionados.length === 0 || !horaInicio || !horaFin) return 0;

    const inicio = parseLocalDate(fechaInicio);
    const fin = parseLocalDate(fechaFin);
    if (!inicio || !fin || fin < inicio) return 0;

    const [hI, mI] = horaInicio.split(':').map(Number);
    const [hF, mF] = horaFin.split(':').map(Number);
    const minutosPorDia = (hF * 60 + mF) - (hI * 60 + mI);
    if (minutosPorDia <= 0) return 0;
    const horasPorDia = minutosPorDia / 60;

    const diaMap = {
      'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0
    };
    const diasNumeros = diasSeleccionados.map(d => diaMap[d]);

    let totalHoras = 0;
    let current = new Date(inicio);
    while (current <= fin) {
      const diaSemana = current.getDay();
      if (diasNumeros.includes(diaSemana)) {
        totalHoras += horasPorDia;
      }
      current.setDate(current.getDate() + 1);
    }
    return totalHoras;
  };

  const validarHorasSuficientes = () => {
    const { fechas, horario } = formData;
    if (!fechas.inicio || !fechas.fin || horario.dias.length === 0 || !horario.hora_inicio || !horario.hora_fin || horasPrograma <= 0) {
      return true;
    }

    const horasDisponibles = calcularHorasEnRango(
      fechas.inicio, fechas.fin, horario.dias, horario.hora_inicio, horario.hora_fin
    );

    if (horasDisponibles < horasPrograma) {
      Swal.fire({
        icon: 'warning',
        title: '⚠️ Fechas insuficientes',
        html: `El rango de fechas seleccionado permite solo <strong>${horasDisponibles.toFixed(1)} horas</strong> de formación,<br> pero el programa requiere <strong>${horasPrograma} horas</strong>.<br><br>Se recomienda ampliar la fecha fin o ajustar el horario/días.`,
        confirmButtonColor: '#e74c3c'
      });
      return false;
    } else if (horasDisponibles > horasPrograma * 1.5) {
      Swal.fire({
        icon: 'info',
        title: '📅 Exceso de tiempo',
        html: `El rango de fechas permite <strong>${horasDisponibles.toFixed(1)} horas</strong>, pero el programa solo necesita <strong>${horasPrograma} horas</strong>.<br>¿Desea mantener la fecha fin actual?`,
        confirmButtonText: 'Sí, mantener',
        showCancelButton: true,
        cancelButtonText: 'Recalcular automático',
        cancelButtonColor: '#3498db'
      }).then((result) => {
        if (result.isDismissed) {
          handleRecalcularFechaFin();
        }
      });
      return true;
    }
    return true;
  };

  // ===== VALIDACIÓN POR PASO =====
  // ===== VALIDACIÓN POR PASO =====
  // ===== VALIDACIÓN POR PASO =====
const validarPasoActual = () => {
  switch (pasoActual) {
    case 1: // Programa de Formación
      if (!formData.programa_formacion) return false;
      if (!formData.modalidad) return false;
      if (!formData.tipo_oferta) return false;
      return true;

    case 2: // Cupos y Horario
      if (!formData.cupo_maximo) return false;
      if (!formData.ambiente.nombre) return false;
      if (!formData.fechas.inicio) return false;
      if (!formData.fechas.fin) return false;

      const fechaInicio = parseLocalDate(formData.fechas.inicio);
      const fechaFin = parseLocalDate(formData.fechas.fin);
      if (!fechaInicio || !fechaFin || fechaFin <= fechaInicio) return false;

      if (modo === 'regular') {
        if (!formData.horario.hora_inicio) return false;
        if (!formData.horario.hora_fin) return false;
        if (formData.horario.dias.length === 0) return false;

        const horasDisponibles = calcularHorasEnRango(
          formData.fechas.inicio,
          formData.fechas.fin,
          formData.horario.dias,
          formData.horario.hora_inicio,
          formData.horario.hora_fin
        );
        if (horasDisponibles < horasPrograma) return false;
      }
      return true;

    case 3: // Ubicación y Empresa
      if (!formData.ubicacion.municipio) return false;
      if (!formData.ubicacion.direccion) return false;
      if (!formData.subsector_economico.nombre) return false;

      // Validar empresa y carta para oferta cerrada
      if (esOfertaCerrada) {
        if (!formData.empresa_solicitante) return false;
        if (!formData.carta_pdf) return false;
      }

      // Validar instructores para modo campesena
      if (modo === 'campesena' && formData.instructores) {
        const totalHorasInstructores = formData.instructores.reduce((sum, inst) => {
          let total = 0;
          inst.programacion?.forEach(mes => {
            mes.rangos?.forEach(rango => {
              if (rango.desde && rango.hasta && rango.hora_inicio && rango.hora_fin) {
                const desde = new Date(rango.desde);
                const hasta = new Date(rango.hasta);
                const [hi, mi] = rango.hora_inicio.split(':').map(Number);
                const [hf, mf] = rango.hora_fin.split(':').map(Number);
                const minutosPorDia = (hf * 60 + mf) - (hi * 60 + mi);
                if (minutosPorDia > 0 && hasta >= desde) {
                  const diffDias = Math.floor((hasta - desde) / (1000 * 60 * 60 * 24)) + 1;
                  total += (minutosPorDia / 60) * diffDias;
                }
              }
            });
          });
          return sum + total;
        }, 0);

        if (Math.abs(totalHorasInstructores - horasPrograma) > 0.1) return false;
      }
      return true;

    case 4: // Documentos
      // El convenio se valida al enviar el formulario
      return true;

    default:
      return true;
  }
};

  useEffect(() => {
    if (modo === 'regular' && !fechasFinModificada) {
      return;
    }
    if (formData.fechas.inicio && formData.fechas.fin && formData.horario.dias.length > 0) {
      validarHorasSuficientes();
    }
  }, [
    formData.fechas.inicio,
    formData.fechas.fin,
    formData.horario.hora_inicio,
    formData.horario.hora_fin,
    formData.horario.dias,
    horasPrograma,
    fechasFinModificada
  ]);

  // ===== LÓGICA PARA DETERMINAR INSTRUCTORES (CAMPESENA) =====
  const determinarInstructores = (tipoProgramaId) => {
    const tipoSeleccionado = tiposPrograma.find(t => t._id === tipoProgramaId);
    if (!tipoSeleccionado) return { primero: '', segundo: '' };

    const tipoNombre = tipoSeleccionado.nombre;

    const instructores = {
      'Técnico': { primero: 'Empresarial', segundo: 'Popular' },
      'Empresarial': { primero: 'Técnico', segundo: 'Popular' },
      'Popular': { primero: 'Técnico', segundo: 'Empresarial' }
    };

    return instructores[tipoNombre] || { primero: '', segundo: '' };
  };


  // Cargar datos del usuario autenticado - VERSIÓN CORREGIDA
  useEffect(() => {
    const cargarUsuarioActual = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('🔑 Token:', token ? 'Existe' : 'No existe');
        
        if (!token) {
          console.warn('⚠️ No hay token de autenticación');
          // Datos de prueba para desarrollo
          setUsuarioActual({
            nombre: 'Instructor',
            apellido: 'Demo',
            numeroIdentificacion: '12345678',
            correoElectronico: 'instructor@demo.com',
            telefono: '3001234567',
            tipoIdentificacion: { siglas: 'CC' }
          });
          return;
        }
        
        // Decodificar el token para obtener el ID del usuario
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        console.log('📦 Payload del token:', payload);
        
        const userId = payload.id;
        console.log('🆔 ID del usuario:', userId);
        
        // Usar el endpoint existente /usuarios/:id
        const response = await api.get(`/usuarios/${userId}`);
        console.log('👤 Usuario obtenido:', response.data);
        
        const user = response.data.data;
        
        setUsuarioActual({
          nombre: user.nombre || 'Instructor',
          apellido: user.apellido || '',
          numeroIdentificacion: user.numeroIdentificacion || user.identificacion || '12345678',
          correoElectronico: user.correoElectronico || 'instructor@ejemplo.com',
          telefono: user.telefono || '3001234567',
          tipoIdentificacion: user.tipoIdentificacion || { siglas: 'CC' }
        });
        
        console.log('✅ Usuario actual cargado correctamente');
        
      } catch (error) {
        console.error('❌ Error cargando usuario:', error);
        // Datos de prueba para que puedas ver el selector
        setUsuarioActual({
          nombre: 'Instructor',
          apellido: 'Demo',
          numeroIdentificacion: '12345678',
          correoElectronico: 'demo@ejemplo.com',
          telefono: '3001234567',
          tipoIdentificacion: { siglas: 'CC' }
        });
      }
    };
    
    cargarUsuarioActual();
  }, []);


  // ===== EFECTO PARA ACTUALIZAR INSTRUCTORES =====
  useEffect(() => {
    if (modo === 'campesena' && formData.tipo_programa) {
      const instructores = determinarInstructores(formData.tipo_programa);
      setInstructoresVisibles(instructores);
    }
  }, [formData.tipo_programa, tiposPrograma, modo]);

  // ===== FUNCIONES PARA MANEJAR EMPRESA =====
  const handleNuevaEmpresaChange = (e) => {
    const { name, value } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setNuevaEmpresa({
        ...nuevaEmpresa,
        [parent]: {
          ...nuevaEmpresa[parent],
          [child]: value
        }
      });
    } else {
      setNuevaEmpresa({
        ...nuevaEmpresa,
        [name]: value
      });
    }
  };

  // Función para mostrar alertas de validación
  const mostrarAlertaValidacion = (mensaje) => {
    Swal.fire({
      icon: 'warning',
      title: 'Campo requerido',
      text: mensaje,
      timer: 3000,
      showConfirmButton: true,
      confirmButtonColor: '#3498db'
    });
  };

  const crearNuevaEmpresa = async () => {
    try {
      if (!nuevaEmpresa.nombre) { mostrarAlertaValidacion('El nombre de la empresa es obligatorio'); return; }
      if (!nuevaEmpresa.nit) { mostrarAlertaValidacion('El NIT es obligatorio'); return; }
      if (!nuevaEmpresa.fecha_creacion) { mostrarAlertaValidacion('La fecha de creación es obligatoria'); return; }
      if (!nuevaEmpresa.direccion) { mostrarAlertaValidacion('La dirección es obligatoria'); return; }
      if (!nuevaEmpresa.representante_legal.nombre_completo) { mostrarAlertaValidacion('El nombre del representante legal es obligatorio'); return; }
      if (!nuevaEmpresa.contacto.nombre_completo) { mostrarAlertaValidacion('El nombre del contacto es obligatorio'); return; }
      if (!nuevaEmpresa.contacto.telefono) { mostrarAlertaValidacion('El teléfono del contacto es obligatorio'); return; }
      if (!nuevaEmpresa.contacto.correo) { mostrarAlertaValidacion('El correo del contacto es obligatorio'); return; }
      if (!nuevaEmpresa.numero_empleados) { mostrarAlertaValidacion('El número de empleados es obligatorio'); return; }

      setLoading(true);

      const response = await api.post('/empresas', nuevaEmpresa);

      setEmpresas([...empresas, response.data.data]);
      setFormData({ ...formData, empresa_solicitante: response.data.data._id });
      setMostrarFormularioEmpresa(false);

      setNuevaEmpresa({
        nombre: '', nit: '', fecha_creacion: '', tipo_empresa: 'Privada', direccion: '',
        representante_legal: { nombre_completo: '', documento_identidad: '', telefono: '', correo: '' },
        contacto: { nombre_completo: '', cargo: '', telefono: '', correo: '' },
        numero_empleados: ''
      });

      Swal.fire({ icon: 'success', title: '¡Empresa creada!', text: 'La empresa se ha registrado exitosamente', timer: 2000, showConfirmButton: false });
    } catch (error) {
      console.error('Error creando empresa:', error);
      let mensajeError = error.message;
      if (error.response?.data?.message) mensajeError = error.response.data.message;
      Swal.fire({ icon: 'error', title: 'Error', text: mensajeError, confirmButtonColor: '#e74c3c' });
    } finally {
      setLoading(false);
    }
  };

  const calcularFechaFinEstimada = () => {
    const fechaInicio = formData.fechas.inicio;
    const horaInicio = formData.horario.hora_inicio;
    const horaFin = formData.horario.hora_fin;
    const diasSeleccionados = formData.horario.dias;
    const horasNecesarias = horasPrograma;

    if (!fechaInicio || !horaInicio || !horaFin || diasSeleccionados.length === 0 || horasNecesarias <= 0) return null;

    const [hI, mI] = horaInicio.split(':').map(Number);
    const [hF, mF] = horaFin.split(':').map(Number);
    const minutosPorDia = (hF * 60 + mF) - (hI * 60 + mI);
    if (minutosPorDia <= 0) return null;
    const horasPorDia = minutosPorDia / 60;

    const diaMap = { 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0 };
    const diasNumeros = diasSeleccionados.map(d => diaMap[d]);

    let horasAcumuladas = 0;
    let current = parseLocalDate(fechaInicio);

    while (horasAcumuladas < horasNecesarias) {
      const diaSemana = current.getDay();
      if (diasNumeros.includes(diaSemana)) horasAcumuladas += horasPorDia;
      if (horasAcumuladas < horasNecesarias) current.setDate(current.getDate() + 1);
    }

    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleRecalcularFechaFin = () => {
    setFechasFinModificada(false);
    const nuevaFechaFin = calcularFechaFinEstimada();
    if (nuevaFechaFin) {
      setFormData(prev => ({ ...prev, fechas: { ...prev.fechas, fin: nuevaFechaFin } }));
      setTimeout(() => { validarHorasSuficientes(); }, 100);
    }
  };

  // ===== FUNCIÓN PARA MANEJAR ARCHIVOS PDF =====
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(files[0].type)) {
        Swal.fire({ icon: 'error', title: 'Formato incorrecto', text: 'Solo se permiten archivos PDF, PNG o JPG', timer: 3000, showConfirmButton: false });
        return;
      }
      if (files[0].size > 5 * 1024 * 1024) {
        Swal.fire({ icon: 'error', title: 'Archivo demasiado grande', text: 'El archivo no puede superar los 5MB', timer: 3000, showConfirmButton: false });
        return;
      }
      setFormData({ ...formData, [name]: files[0] });
    }
  };

  // ===== FUNCIÓN PARA CAMBIOS EN CAMPOS NORMALES =====
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'fechas.fin') setFechasFinModificada(true);

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({ ...formData, [parent]: { ...formData[parent], [child]: value } });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ===== FUNCIÓN PARA CAMBIOS EN DÍAS =====
  const handleDiaChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setFormData({ ...formData, horario: { ...formData.horario, dias: [...formData.horario.dias, value] } });
    } else {
      setFormData({ ...formData, horario: { ...formData.horario, dias: formData.horario.dias.filter(dia => dia !== value) } });
    }
  };

  // ===== FUNCIÓN PARA VALIDAR EL FORMULARIO =====
  const validarFormulario = () => {
    if (!formData.programa_formacion) { mostrarAlertaValidacion('Seleccione un programa de formación'); return false; }
    if (!formData.modalidad) { mostrarAlertaValidacion('Seleccione una modalidad'); return false; }
    if (!formData.tipo_oferta) { mostrarAlertaValidacion('Seleccione un tipo de oferta'); return false; }
    if (!formData.cupo_maximo) { mostrarAlertaValidacion('Ingrese el cupo máximo'); return false; }
    if (!formData.ambiente.nombre) { mostrarAlertaValidacion('El nombre del ambiente es obligatorio'); return false; }
    if (!formData.fechas.inicio || !formData.fechas.fin) { mostrarAlertaValidacion('Ingrese las fechas de inicio y fin'); return false; }

    const fechaInicio = parseLocalDate(formData.fechas.inicio);
    const fechaFin = parseLocalDate(formData.fechas.fin);
    if (!fechaInicio || !fechaFin || fechaFin <= fechaInicio) {
      Swal.fire({ icon: 'warning', title: 'Fechas inválidas', text: 'La fecha de fin debe ser posterior a la fecha de inicio', timer: 3000, showConfirmButton: true });
      return false;
    }

    if (!formData.ubicacion.municipio) { mostrarAlertaValidacion('Seleccione un municipio'); return false; }
    if (!formData.ubicacion.direccion) { mostrarAlertaValidacion('Ingrese la dirección'); return false; }
    if (!formData.subsector_economico.nombre) { mostrarAlertaValidacion('Ingrese el subsector económico'); return false; }
    if (!formData.convenio.nombre) { mostrarAlertaValidacion('El nombre del convenio es obligatorio'); return false; }

    if (esOfertaCerrada) {
      if (!formData.empresa_solicitante) { mostrarAlertaValidacion('Para oferta cerrada, la empresa solicitante es obligatoria'); return false; }
      if (!formData.carta_pdf) { mostrarAlertaValidacion('Para oferta cerrada, la carta de la empresa es obligatoria'); return false; }
    }

    if (modo === 'regular' && formData.horario.dias.length === 0) { mostrarAlertaValidacion('Seleccione al menos un día'); return false; }

    return true;
  };

  // ===== FUNCIÓN PARA ENVIAR EL FORMULARIO =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const tipoProgramaId = modo === 'regular' ? tiposProgramaIds.regular : tiposProgramaIds.campesena;

      if (!tipoProgramaId) {
        Swal.fire({ icon: 'error', title: 'Error de configuración', text: 'No se encontró el ID del tipo de programa. Verifica que existan "Regular" y "Campesena" en la base de datos.', confirmButtonColor: '#e74c3c' });
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('programa_formacion', formData.programa_formacion);
      formDataToSend.append('modalidad', formData.modalidad);
      formDataToSend.append('tipo_oferta', formData.tipo_oferta);
      formDataToSend.append('cupo_maximo', formData.cupo_maximo);
      formDataToSend.append('empresa_solicitante', formData.empresa_solicitante);
      formDataToSend.append('programa_especial', formData.programa_especial || '');
      formDataToSend.append('tipo_programa', tipoProgramaId);
      formDataToSend.append('modo', modo);
      formDataToSend.append('ambiente_nombre', formData.ambiente.nombre);
      formDataToSend.append('fechas_inicio', formData.fechas.inicio);
      formDataToSend.append('fechas_fin', formData.fechas.fin);
      formDataToSend.append('ubicacion_departamento', formData.ubicacion.departamento);
      formDataToSend.append('ubicacion_municipio', formData.ubicacion.municipio);
      formDataToSend.append('ubicacion_direccion', formData.ubicacion.direccion);
      formDataToSend.append('subsector_nombre', formData.subsector_economico.nombre);
      formDataToSend.append('convenio_nombre', formData.convenio.nombre);

      if (modo === 'regular') {
        formDataToSend.append('horario_hora_inicio', formData.horario.hora_inicio);
        formDataToSend.append('horario_hora_fin', formData.horario.hora_fin);
        formDataToSend.append('horario_dias', JSON.stringify(formData.horario.dias));
      }

      formDataToSend.append('horario_dias', JSON.stringify(formData.horario.dias));
      formDataToSend.append('duracion_meses', '12');

      if (formData.firma_digital_pdf) formDataToSend.append('firma_digital_pdf', formData.firma_digital_pdf);
      if (formData.carta_pdf) formDataToSend.append('carta_pdf', formData.carta_pdf);

      if (modo === 'campesena' && formData.instructores) {
        formDataToSend.append('instructores', JSON.stringify(formData.instructores));
        console.log('📤 Instructores enviados:', formData.instructores);
      }

      console.log('📤 Enviando datos con archivos...');
      console.log('📤 tipo_programa enviado:', tipoProgramaId, 'para modo:', modo);

      Swal.fire({ title: 'Guardando oferta...', text: 'Por favor espere', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); } });

      const response = await api.post('/ofertas', formDataToSend, { headers: { 'Content-Type': 'multipart/form-data' } });

      Swal.close();
      Swal.fire({ icon: 'success', title: '¡Oferta creada!', text: 'La oferta se ha guardado exitosamente', timer: 2000, showConfirmButton: false });
      console.log('Respuesta:', response.data);
      setTimeout(() => { window.location.reload(); }, 2000);

    } catch (error) {
      console.error('Error:', error);
      Swal.close();
      let mensajeError = error.message;
      if (error.response?.data?.errors) mensajeError = error.response.data.errors.join(', ');
      else if (error.response?.data?.message) mensajeError = error.response.data.message;
      Swal.fire({ icon: 'error', title: 'Error', text: mensajeError, confirmButtonColor: '#e74c3c' });
    } finally {
      setLoading(false);
    }
  };

  // Filtrar programas según texto y horas
  const getProgramasFiltrados = () => {
    let filtrados = [...programas];
    if (filtroPrograma.trim() !== '') {
      const keyword = filtroPrograma.toLowerCase();
      filtrados = filtrados.filter(prog => prog.nombre_programa.toLowerCase().includes(keyword));
    }
    if (filtroHoras !== '' && !isNaN(filtroHoras)) {
      const horas = parseInt(filtroHoras, 10);
      filtrados = filtrados.filter(prog => {
        const duracion = parseInt(prog.duracion_maxima, 10);
        return !isNaN(duracion) && duracion >= horas;
      });
    }
    return filtrados;
  };

  const getMunicipiosFiltradosBusqueda = () => {
    if (!busquedaMunicipio.trim()) return municipios;
    const keyword = busquedaMunicipio.toLowerCase();
    return municipios.filter(mun => mun.nombre.toLowerCase().includes(keyword));
  };

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  const horarioMinutosPorDia = (() => {
    const { hora_inicio, hora_fin, dias } = formData.horario;
    if (!hora_inicio || !hora_fin || dias.length === 0) return 0;
    const [hI, mI] = hora_inicio.split(':').map(Number);
    const [hF, mF] = hora_fin.split(':').map(Number);
    const minutos = (hF * 60 + mF) - (hI * 60 + mI);
    return minutos > 0 ? minutos : 0;
  })();

  const horasPorDia = horarioMinutosPorDia / 60;
  const horasPorSemana = horasPorDia * formData.horario.dias.length;
  const semanasNecesarias = horasPorSemana > 0 && horasPrograma > 0 ? Math.ceil(horasPrograma / horasPorSemana) : null;

  const tipoOfertaSeleccionado = tiposOferta.find(t => t._id === formData.tipo_oferta);
  const esOfertaCerrada = tipoOfertaSeleccionado?.nombre?.toLowerCase() === 'cerrada';

  // ===== RENDER PRINCIPAL =====
  return (
    <div className="max-w-5xl mx-auto">
      {/* Dynamic Header con selector de tipo */}
      <div className={`flex items-center justify-between mb-8 p-6 rounded-xl transition-colors duration-500 shadow-sm ${modo === 'regular' ? 'bg-[#006c49]' : 'bg-amber-600'} text-white`}>
        <div className="flex items-center gap-4">
          <button
            onClick={onVolverAlSelector}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {modo === 'regular' ? 'Crear Oferta Regular' : 'Crear Oferta Campesena'}
            </h1>
            <p className="text-sm text-white/80">Complete la información técnica paso a paso.</p>
          </div>
        </div>

        {/* Selector de modo */}
        <div className="flex items-center bg-white/10 p-1 rounded-lg">
         
        </div>
      </div>

      {/* Visual Stepper con indicador de completado */}
      <div className="mb-8 flex items-center justify-between bg-[#eff4ff] p-4 rounded-xl border border-[#c5c6cd]/30">
        {[
          { num: 1, label: 'Programa' },
          { num: 2, label: 'Cupos y Horario' },
          { num: 3, label: 'Ubicación' },
          { num: 4, label: 'Documentos' }
        ].map((step, idx) => {
          const estaCompleto = pasoActual > step.num;
          const esValido = pasoActual === step.num && validarPasoActual();

          return (
            <React.Fragment key={step.num}>
              <div className={`flex items-center gap-3 flex-1 ${pasoActual !== step.num && !estaCompleto ? 'opacity-50' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-all ${
                  estaCompleto
                    ? 'bg-[#006c49] text-white'
                    : pasoActual === step.num
                      ? esValido ? 'bg-[#006c49] text-white ring-2 ring-[#006c49] ring-offset-2' : 'bg-[#006c49] text-white'
                      : 'bg-[#dce9ff] text-[#0b1c30]'
                }`}>
                  {estaCompleto ? (
                    <span className="material-symbols-outlined text-sm">check</span>
                  ) : (
                    step.num
                  )}
                </div>
                <span className={`text-sm font-medium ${pasoActual === step.num ? 'text-[#006c49] font-bold' : 'text-[#45474c]'}`}>
                  {step.label}
                  {pasoActual === step.num && !esValido && (
                    <span className="ml-2 text-xs text-red-500">(incompleto)</span>
                  )}
                </span>
              </div>
              {idx < 3 && <div className="h-[2px] bg-[#c5c6cd] flex-1 mx-4"></div>}
            </React.Fragment>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* STEP 1: Programa de Formación */}
        {pasoActual === 1 && (
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-[#c5c6cd]/30">
            <div className="flex items-center gap-2 mb-6 text-[#006c49]">
              <span className="material-symbols-outlined">menu_book</span>
              <h2 className="text-xl font-semibold">Programa de Formación</h2>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[#45474c] mb-1">Filtrar por palabra</label>
                <input
                  type="text"
                  placeholder="Ej: pecuaria, administrativa"
                  value={filtroPrograma}
                  onChange={(e) => setFiltroPrograma(e.target.value)}
                  className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] focus:border-[#006c49] outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#45474c] mb-1">Duración mínima (horas)</label>
                <input
                  type="number"
                  placeholder="Ej: 40"
                  value={filtroHoras}
                  onChange={(e) => setFiltroHoras(e.target.value)}
                  className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] focus:border-[#006c49] outline-none transition-all"
                  min="0"
                />
              </div>
            </div>
            <div className="mb-4">
              <button
                type="button"
                onClick={() => { setFiltroPrograma(''); setFiltroHoras(''); }}
                className="text-xs text-[#75777d] hover:text-[#006c49] underline transition-colors"
              >
                Limpiar filtros
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#45474c] mb-1">Programa *</label>
                <select
                  name="programa_formacion"
                  value={formData.programa_formacion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none transition-all"
                  required
                >
                  <option value="">Seleccione...</option>
                  {getProgramasFiltrados().map(prog => (
                    <option key={prog._id} value={prog._id}>
                      {prog.nombre_programa} - {prog.codigo} {prog.duracion_maxima ? `(${prog.duracion_maxima} h)` : ''}
                    </option>
                  ))}
                </select>
                {getProgramasFiltrados().length === 0 && (
                  <p className="mt-1 text-xs text-red-500 italic">No hay programas que coincidan con los filtros</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#45474c] mb-1">Modalidad *</label>
                <select
                  name="modalidad"
                  value={formData.modalidad}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none transition-all"
                  required
                >
                  <option value="">Seleccione...</option>
                  {modalidades.map(mod => (
                    <option key={mod._id} value={mod._id}>{mod.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#45474c] mb-1">Tipo de Oferta *</label>
                <select
                  name="tipo_oferta"
                  value={formData.tipo_oferta}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none transition-all"
                  required
                >
                  <option value="">Seleccione...</option>
                  {tiposOferta.map(to => (
                    <option key={to._id} value={to._id}>{to.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Cupos, Fechas y Horario */}
        {pasoActual === 2 && (
          <div className="space-y-6">
            {/* Cupos y Ambiente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-[#c5c6cd]/30">
                <div className="flex items-center gap-2 mb-6 text-[#006c49]">
                  <span className="material-symbols-outlined">groups</span>
                  <h2 className="text-xl font-semibold">Cupos</h2>
                </div>
                <label className="block text-xs font-medium text-[#45474c] mb-1">Capacidad Máxima (Cupos)</label>
                <input
                  type="number"
                  name="cupo_maximo"
                  value={formData.cupo_maximo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none transition-all"
                  placeholder="30"
                  min="1"
                  required
                />
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-[#c5c6cd]/30">
                <div className="flex items-center gap-2 mb-6 text-[#006c49]">
                  <span className="material-symbols-outlined">meeting_room</span>
                  <h2 className="text-xl font-semibold">Modelo de Ambiente</h2>
                </div>
                <label className="block text-xs font-medium text-[#45474c] mb-1">Nombre del Ambiente *</label>
                <input
                  type="text"
                  name="ambiente.nombre"
                  value={formData.ambiente.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none transition-all"
                  placeholder="Ej: Laboratorio de Cómputo B2"
                  required
                />
              </div>
            </div>

            {/* Fechas */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-[#c5c6cd]/30">
              <div className="flex items-center gap-2 mb-6 text-[#006c49]">
                <span className="material-symbols-outlined">calendar_today</span>
                <h2 className="text-xl font-semibold">Periodo de Formación</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-[#45474c] mb-1">Fecha Inicio *</label>
                  <input
                    type="date"
                    name="fechas.inicio"
                    value={formData.fechas.inicio}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#45474c] mb-1">Fecha Fin *</label>
                  <input
                    type="date"
                    name="fechas.fin"
                    value={formData.fechas.fin}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none transition-all"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRecalcularFechaFin}
                  className="flex items-center justify-center gap-2 bg-[#001334] text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-base">autorenew</span>
                  Recalcular fecha fin
                </button>
              </div>
            </div>

            {/* Horario - Solo para modo regular */}
            {modo === 'regular' && (
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-[#c5c6cd]/30 transition-all duration-300">
                <div className="flex items-center gap-2 mb-6 text-[#006c49]">
                  <span className="material-symbols-outlined">schedule</span>
                  <h2 className="text-xl font-semibold">Horario</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#45474c] mb-1">Hora Inicio</label>
                        <input
                          type="time"
                          name="horario.hora_inicio"
                          value={formData.horario.hora_inicio}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none transition-all"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#45474c] mb-1">Hora Fin</label>
                        <input
                          type="time"
                          name="horario.hora_fin"
                          value={formData.horario.hora_fin}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none transition-all"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474c] mb-2">Días de la Semana</label>
                      <div className="flex flex-wrap gap-2">
                        {diasSemana.map(dia => (
                          <label key={dia} className="flex items-center gap-2 px-3 py-1.5 bg-[#eff4ff] rounded-lg cursor-pointer border-2 border-transparent hover:border-[#006c49] transition-all">
                            <input
                              type="checkbox"
                              value={dia}
                              checked={formData.horario.dias.includes(dia)}
                              onChange={handleDiaChange}
                              className="rounded text-[#006c49] focus:ring-[#006c49]"
                            />
                            <span className="text-sm font-medium">{dia.slice(0, 3)}</span>
                          </label>
                        ))}
                      </div>
                      {horasPrograma > 0 && (horasPorDia <= 0 || formData.horario.dias.length === 0) && (
                        <p className="mt-2 text-xs text-amber-600 italic">⚠️ Configure horario y días para calcular la fecha fin automáticamente.</p>
                      )}
                    </div>
                  </div>
                  {horasPorSemana > 0 && (
                    <div className="bg-[#dce9ff] p-4 rounded-xl border border-[#c5c6cd]/30">
                      <h3 className="text-xs font-medium text-[#006c49] mb-2 uppercase tracking-wider">Resumen Calculado</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#45474c]">Horas/Día:</span>
                          <span className="font-bold text-[#0b1c30]">{horasPorDia.toFixed(1)}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#45474c]">Horas/Semana:</span>
                          <span className="font-bold text-[#0b1c30]">{horasPorSemana.toFixed(1)}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#45474c]">Semanas Totales:</span>
                          <span className="font-bold text-[#0b1c30]">{semanasNecesarias}</span>
                        </div>
                        {formData.fechas.inicio && formData.fechas.fin && (
                          <div className="flex justify-between">
                            <span className="text-[#45474c]">Horas disponibles:</span>
                            <span className="font-bold text-[#0b1c30]">
                              {calcularHorasEnRango(formData.fechas.inicio, formData.fechas.fin, formData.horario.dias, formData.horario.hora_inicio, formData.horario.hora_fin).toFixed(1)}h
                            </span>
                          </div>
                        )}
                      </div>
                      {horasPrograma > 0 && (
                        <div className="mt-3 p-2 bg-[#6cf8bb]/30 text-[#005236] rounded text-center text-xs font-medium">
                          {calcularHorasEnRango(formData.fechas.inicio, formData.fechas.fin, formData.horario.dias, formData.horario.hora_inicio, formData.horario.hora_fin) >= horasPrograma ? '✅ Cumple requerimientos' : '⚠️ Horas insuficientes'}
                        </div>
                      )}
                      <p className="mt-2 text-xs text-[#75777d] italic">* Puedes modificar la fecha fin manualmente si hay festivos o ajustes.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Ubicación y Empresa */}
        {pasoActual === 3 && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-[#c5c6cd]/30">
              <div className="flex items-center gap-2 mb-6 text-[#006c49]">
                <span className="material-symbols-outlined">location_on</span>
                <h2 className="text-xl font-semibold">Ubicación</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#45474c] mb-1">Departamento *</label>
                  <input
                    type="text"
                    name="ubicacion.departamento"
                    value={formData.ubicacion.departamento}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none transition-all"
                    placeholder="Cauca"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#45474c] mb-1">Municipio *</label>
                  <div className="custom-select-container relative">
                    <div
                      className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg cursor-pointer flex justify-between items-center bg-white"
                      onClick={() => setMunicipioAbierto(!municipioAbierto)}
                    >
                      <span className="text-sm">
                        {municipios.find(m => m._id === formData.ubicacion.municipio)?.nombre || 'Seleccione...'}
                      </span>
                      <span className="material-symbols-outlined text-[#75777d]">{municipioAbierto ? 'expand_less' : 'expand_more'}</span>
                    </div>
                    {municipioAbierto && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-[#c5c6cd] rounded-lg shadow-lg">
                        <input
                          type="text"
                          placeholder="Buscar municipio..."
                          value={busquedaMunicipio}
                          onChange={(e) => setBusquedaMunicipio(e.target.value)}
                          className="w-full p-2 border-b border-[#c5c6cd] outline-none text-sm"
                          autoFocus
                        />
                        <div className="max-h-48 overflow-y-auto">
                          {getMunicipiosFiltradosBusqueda().length === 0 ? (
                            <div className="p-2 text-center text-[#75777d] text-sm">No hay resultados</div>
                          ) : (
                            getMunicipiosFiltradosBusqueda().map(mun => (
                              <div
                                key={mun._id}
                                className="p-2 cursor-pointer hover:bg-[#eff4ff] text-sm"
                                onClick={() => {
                                  handleChange({ target: { name: 'ubicacion.municipio', value: mun._id } });
                                  setMunicipioAbierto(false);
                                  setBusquedaMunicipio('');
                                }}
                              >
                                {mun.nombre}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-[#45474c] mb-1">Dirección *</label>
                  <input
                    type="text"
                    name="ubicacion.direccion"
                    value={formData.ubicacion.direccion}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none transition-all"
                    placeholder="Calle 123 #45-67, Barrio Centro"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Subsector Económico */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-[#c5c6cd]/30">
              <div className="flex items-center gap-2 mb-4 text-[#006c49]">
                <span className="material-symbols-outlined">category</span>
                <h2 className="text-xl font-semibold">Subsector Económico</h2>
              </div>
              <label className="block text-xs font-medium text-[#45474c] mb-1">Nombre *</label>
              <input
                type="text"
                name="subsector_economico.nombre"
                value={formData.subsector_economico.nombre}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none transition-all"
                placeholder="Ej: Tecnologías de la Información"
                required
              />
            </div>

            {/* Empresa Solicitante */}
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-[#c5c6cd]/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-[#006c49]">
                  <span className="material-symbols-outlined">business</span>
                  <h2 className="text-xl font-semibold">Empresa Solicitante</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarFormularioEmpresa(!mostrarFormularioEmpresa)}
                  className="flex items-center gap-1 text-sm text-[#001334] hover:underline"
                >
                  <span className="material-symbols-outlined text-sm">add_circle</span>
                  {mostrarFormularioEmpresa ? 'Cancelar' : 'Crear Nueva Empresa'}
                </button>
              </div>

              {!mostrarFormularioEmpresa ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#45474c] mb-1">Seleccionar Empresa</label>
                      <select
                        name="empresa_solicitante"
                        value={formData.empresa_solicitante}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none transition-all"
                      >
                        <option value="">Seleccione una empresa...</option>
                        {empresas.map(emp => (
                          <option key={emp._id} value={emp._id}>{emp.nombre} - NIT: {emp.nit}</option>
                        ))}
                      </select>
                      <p className="text-xs text-[#75777d] mt-1">
                        {esOfertaCerrada ? '* Empresa obligatoria para oferta cerrada' : 'Empresa opcional para oferta abierta'}
                      </p>
                    </div>
                  </div>

                  {/* Campo carta PDF */}
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-[#45474c] mb-1">
                      Carta (PDF) {esOfertaCerrada && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        id="carta_pdf"
                        name="carta_pdf"
                        onChange={handleFileChange}
                        className="text-sm text-[#45474c] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#eff4ff] file:text-[#006c49] hover:file:bg-[#dce9ff] transition-all"
                        accept=".pdf"
                      />
                      {formData.carta_pdf && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#6cf8bb]/20 rounded-lg text-xs text-[#005236]">
                          <span>✅ {formData.carta_pdf.name}</span>
                          <button
                            type="button"
                            onClick={() => { document.getElementById('carta_pdf').value = ''; setFormData({ ...formData, carta_pdf: null }); }}
                            className="text-red-400 hover:text-red-600 font-bold"
                          >✕</button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-[#75777d] mt-1">
                      Documento PDF de la carta solicitante {esOfertaCerrada ? '(obligatorio)' : '(opcional)'}
                    </p>
                  </div>
                </>
              ) : (
                /* Formulario nueva empresa */
                <div className="p-4 border border-dashed border-[#adc6ff] rounded-xl bg-[#eff4ff] space-y-4">
                  <h3 className="font-semibold text-[#001334]">Nueva Empresa</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#45474c] mb-1">Nombre de la Empresa</label>
                      <input type="text" name="nombre" value={nuevaEmpresa.nombre} onChange={handleNuevaEmpresaChange}
                        className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none bg-white text-sm"
                        placeholder="Nombre de la empresa" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474c] mb-1">NIT</label>
                      <input type="text" name="nit" value={nuevaEmpresa.nit} onChange={handleNuevaEmpresaChange}
                        className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none bg-white text-sm"
                        placeholder="123456789-0" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474c] mb-1">Fecha Creación</label>
                      <input type="date" name="fecha_creacion" value={nuevaEmpresa.fecha_creacion} onChange={handleNuevaEmpresaChange}
                        className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none bg-white text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474c] mb-1">Tipo de Empresa</label>
                      <select name="tipo_empresa" value={nuevaEmpresa.tipo_empresa} onChange={handleNuevaEmpresaChange}
                        className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none bg-white text-sm">
                        <option value="Privada">Privada</option>
                        <option value="Pública">Pública</option>
                        <option value="Mixta">Mixta</option>
                        <option value="ONG">ONG</option>
                        <option value="Fundación">Fundación</option>
                        <option value="Cooperativa">Cooperativa</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-[#45474c] mb-1">Dirección</label>
                      <input type="text" name="direccion" value={nuevaEmpresa.direccion} onChange={handleNuevaEmpresaChange}
                        className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none bg-white text-sm"
                        placeholder="Dirección completa" />
                    </div>
                  </div>

                  <h4 className="font-semibold text-[#001334] text-sm border-t border-[#c5c6cd] pt-3">Representante Legal</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-[#45474c] mb-1">Nombre Completo</label>
                      <input type="text" name="representante_legal.nombre_completo" value={nuevaEmpresa.representante_legal.nombre_completo} onChange={handleNuevaEmpresaChange}
                        className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none bg-white text-sm"
                        placeholder="Nombre completo del representante" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474c] mb-1">Documento</label>
                      <input type="text" name="representante_legal.documento_identidad" value={nuevaEmpresa.representante_legal.documento_identidad} onChange={handleNuevaEmpresaChange}
                        className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none bg-white text-sm"
                        placeholder="Documento de identidad" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474c] mb-1">Teléfono</label>
                      <input type="text" name="representante_legal.telefono" value={nuevaEmpresa.representante_legal.telefono} onChange={handleNuevaEmpresaChange}
                        className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none bg-white text-sm"
                        placeholder="Teléfono" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-[#45474c] mb-1">Correo</label>
                      <input type="email" name="representante_legal.correo" value={nuevaEmpresa.representante_legal.correo} onChange={handleNuevaEmpresaChange}
                        className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none bg-white text-sm"
                        placeholder="correo@ejemplo.com" />
                    </div>
                  </div>

                  <h4 className="font-semibold text-[#001334] text-sm border-t border-[#c5c6cd] pt-3">Contacto en la Empresa</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-[#45474c] mb-1">Nombre Completo</label>
                      <input type="text" name="contacto.nombre_completo" value={nuevaEmpresa.contacto.nombre_completo} onChange={handleNuevaEmpresaChange}
                        className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none bg-white text-sm"
                        placeholder="Nombre del contacto" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474c] mb-1">Cargo</label>
                      <input type="text" name="contacto.cargo" value={nuevaEmpresa.contacto.cargo} onChange={handleNuevaEmpresaChange}
                        className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none bg-white text-sm"
                        placeholder="Cargo del contacto" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474c] mb-1">Teléfono</label>
                      <input type="text" name="contacto.telefono" value={nuevaEmpresa.contacto.telefono} onChange={handleNuevaEmpresaChange}
                        className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none bg-white text-sm"
                        placeholder="Teléfono del contacto" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-[#45474c] mb-1">Correo</label>
                      <input type="email" name="contacto.correo" value={nuevaEmpresa.contacto.correo} onChange={handleNuevaEmpresaChange}
                        className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none bg-white text-sm"
                        placeholder="correo@ejemplo.com" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#45474c] mb-1">Número de Empleados</label>
                      <input type="number" name="numero_empleados" value={nuevaEmpresa.numero_empleados} onChange={handleNuevaEmpresaChange}
                        className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none bg-white text-sm"
                        placeholder="Ej: 50" min="1" />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={crearNuevaEmpresa} disabled={loading}
                      className="flex-1 bg-[#006c49] text-white px-4 py-2 rounded-lg font-medium hover:brightness-110 active:scale-95 transition-all text-sm disabled:opacity-60">
                      {loading ? 'Guardando...' : 'Guardar Empresa'}
                    </button>
                    <button type="button" onClick={() => setMostrarFormularioEmpresa(false)}
                      className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:brightness-110 active:scale-95 transition-all text-sm">
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Formulario Campesena */}
            {modo === 'campesena' && (
            <FormularioCampesenaCompleto
              formData={formData}
              setFormData={setFormData}
              horasPrograma={horasPrograma}
              fechasInicio={formData.fechas.inicio}
              fechasFin={formData.fechas.fin}
              usuarioActual={usuarioActual}
            />
          )}
          </div>
        )}

        {/* STEP 4: Documentos, Convenio y Programa Especial */}
        {pasoActual === 4 && (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-[#c5c6cd]/30">
              <div className="flex items-center gap-2 mb-6 text-[#006c49]">
                <span className="material-symbols-outlined">info</span>
                <h2 className="text-xl font-semibold">Información Adicional</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#45474c] mb-1">Programa Especial</label>
                  <select
                    name="programa_especial"
                    value={formData.programa_especial}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none transition-all"
                  >
                    <option value="">Ninguno</option>
                    {programasEspeciales.map(pe => (
                      <option key={pe._id} value={pe._id}>{pe.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#45474c] mb-1">Convenio *</label>
                  <input
                    type="text"
                    name="convenio.nombre"
                    value={formData.convenio.nombre}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-[#c5c6cd] rounded-lg focus:ring-2 focus:ring-[#006c49] outline-none transition-all"
                    placeholder="Nombre del convenio"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-[#c5c6cd]/30">
                <div className="flex items-center gap-2 mb-6 text-[#006c49]">
                  <span className="material-symbols-outlined">upload_file</span>
                  <h2 className="text-xl font-semibold">Carta de Solicitud</h2>
                </div>
                <label className="block w-full border-2 border-dashed border-[#c5c6cd] rounded-xl py-8 text-center cursor-pointer hover:bg-[#eff4ff] transition-all">
                  <input
                    type="file"
                    id="carta_pdf"
                    name="carta_pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf"
                  />
                  <span className="material-symbols-outlined text-4xl text-[#75777d] mb-2">picture_as_pdf</span>
                  <p className="text-sm font-medium text-[#45474c]">Subir Carta (PDF)</p>
                  <p className="text-xs text-[#75777d] mt-1">Máximo 5MB</p>
                  {formData.carta_pdf && (
                    <div className="mt-3 p-2 bg-[#6cf8bb]/20 rounded text-sm">
                      ✅ {formData.carta_pdf.name}
                    </div>
                  )}
                </label>
              </div>

              <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-[#c5c6cd]/30">
                <div className="flex items-center gap-2 mb-6 text-[#006c49]">
                  <span className="material-symbols-outlined">draw</span>
                  <h2 className="text-xl font-semibold">Firma Digital</h2>
                </div>
                <label className="block w-full border-2 border-dashed border-[#c5c6cd] rounded-xl py-8 text-center cursor-pointer hover:bg-[#eff4ff] transition-all">
                  <input
                    type="file"
                    id="firma_digital_pdf"
                    name="firma_digital_pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf, image/png, image/jpeg, image/jpg"
                  />
                  <span className="material-symbols-outlined text-4xl text-[#75777d] mb-2">fingerprint</span>
                  <p className="text-sm font-medium text-[#45474c]">Subir Firma Digital</p>
                  <p className="text-xs text-[#75777d] mt-1">PDF, PNG o JPG (Máx 5MB)</p>
                  {formData.firma_digital_pdf && (
                    <div className="mt-3 p-2 bg-[#6cf8bb]/20 rounded text-sm">
                      ✅ {formData.firma_digital_pdf.name}
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Botones de navegación */}
        <div className="flex justify-between items-center pt-6">
          <button
            type="button"
            onClick={() => setPasoActual(Math.max(1, pasoActual - 1))}
            className={`px-6 py-2 rounded-lg font-bold text-[#45474c] hover:bg-[#e5eeff] transition-all ${pasoActual === 1 ? 'invisible' : ''}`}
          >
            Anterior
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                if (validarPasoActual()) {
                  setPasoActual(Math.min(4, pasoActual + 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  Swal.fire({
                    icon: 'warning',
                    title: 'Campos incompletos',
                    text: 'Por favor complete todos los campos obligatorios del paso actual antes de continuar.',
                    confirmButtonColor: '#006c49',
                    timer: 3000
                  });
                }
              }}
              disabled={!validarPasoActual()}
              className={`bg-[#006c49] text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:brightness-110 transition-all flex items-center gap-2 ${pasoActual === 4 ? 'hidden' : ''} ${!validarPasoActual() ? 'opacity-50 cursor-not-allowed hover:brightness-100' : 'active:scale-95'}`}
            >
              Siguiente
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`bg-[#006c49] text-white px-8 py-2 rounded-lg font-bold shadow-lg hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-60 ${pasoActual !== 4 ? 'hidden' : ''}`}
            >
              <span className="material-symbols-outlined text-sm">save</span>
              {loading ? 'Guardando...' : 'Guardar Oferta'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CrearOferta;