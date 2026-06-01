import React, { useState, useEffect } from 'react';

const FormularioCampesenaCompleto = ({ 
  formData, 
  setFormData, 
  horasPrograma = 0, 
  fechasInicio = '', 
  fechasFin = '',
  usuarioActual = null
}) => {
  const [instructores, setInstructores] = useState([]);
  const [rolSeleccionado, setRolSeleccionado] = useState('');
  const [mostrarSelectorRol, setMostrarSelectorRol] = useState(true);
  const [autocompletadoRealizado, setAutocompletadoRealizado] = useState(false);
  const [isUpdatingFromParent, setIsUpdatingFromParent] = useState(false);

  // Roles disponibles
  const rolesDisponibles = [
    { value: 'Técnico', label: '👨‍🏫 Técnico', description: 'Instructor con conocimiento técnico especializado' },
    { value: 'Empresarial', label: '🏢 Empresarial', description: 'Instructor con experiencia en el sector empresarial' },
    { value: 'Popular', label: '👥 Popular', description: 'Instructor con conocimiento comunitario o popular' }
  ];

  // Función para verificar si un rol ya está ocupado
  const isRolOcupado = (rol, instructorId) => {
    return instructores.some(inst => inst.tipo === rol && inst.id !== instructorId);
  };

  // Función para autocompletar instructor con datos del usuario
  const autocompletarInstructorConUsuario = (rol, usuario) => {
    if (!usuario) return null;
    
    return {
      id: Date.now(),
      tipo: rol,
      tipo_identificacion: usuario.tipoIdentificacion?.siglas || 'CC',
      identificacion: usuario.numeroIdentificacion || usuario.identificacion || '',
      nombre: `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim(),
      correo: usuario.correoElectronico || usuario.email || '',
      celular: usuario.telefono || '',
      programacion: [],
      autocompletado: true
    };
  };

  // Inicializar instructores desde formData (solo una vez al montar)
  useEffect(() => {
    if (formData?.instructores && formData.instructores.length > 0 && instructores.length === 0) {
      setIsUpdatingFromParent(true);
      setInstructores(formData.instructores);
      // Verificar si algún instructor es del usuario actual
      const instructorUsuario = formData.instructores.find(inst => inst.autocompletado === true);
      if (instructorUsuario) {
        setRolSeleccionado(instructorUsuario.tipo);
        setMostrarSelectorRol(false);
        setAutocompletadoRealizado(true);
      }
      setIsUpdatingFromParent(false);
    }
  }, [formData?.instructores]);

  // Actualizar formData cuando cambian los instructores (PERO EVITANDO EL BUCLE)
  useEffect(() => {
    if (!isUpdatingFromParent && typeof setFormData === 'function' && instructores.length > 0) {
      // Comparar si realmente hay cambios
      const instructoresActuales = formData?.instructores || [];
      if (JSON.stringify(instructoresActuales) !== JSON.stringify(instructores)) {
        setFormData(prev => ({ ...prev, instructores }));
      }
    }
  }, [instructores]);

  // Autocompletar cuando se selecciona un rol
  const handleRolChange = (rol) => {
    // Verificar si el rol ya está ocupado
    if (isRolOcupado(rol, null)) {
      alert(`⚠️ El rol "${rol}" ya está asignado a otro instructor. No puedes seleccionarlo nuevamente.`);
      return;
    }
    
    setRolSeleccionado(rol);
    
    // Crear instructor autocompletado con datos del usuario
    const instructorAutocompletado = autocompletarInstructorConUsuario(rol, usuarioActual);
    
    if (instructorAutocompletado && instructorAutocompletado.nombre) {
      setInstructores(prev => [...prev, instructorAutocompletado]);
      setAutocompletadoRealizado(true);
    }
    
    // Ocultar el selector después de seleccionar
    setMostrarSelectorRol(false);
  };

  const inicializarInstructor = () => {
    // Verificar qué roles ya están ocupados
    const rolesExistentes = instructores.map(inst => inst.tipo);
    const rolesDisponiblesParaAgregar = ['Técnico', 'Empresarial', 'Popular'].filter(r => !rolesExistentes.includes(r));
    
    // Si el instructor autocompletado ya tiene un rol, ese rol no debe estar disponible
    const primerRolDisponible = rolesDisponiblesParaAgregar[0] || 'Otro';
    
    return {
      id: Date.now() + Math.random(),
      tipo: primerRolDisponible,
      tipo_identificacion: 'CC',
      identificacion: '',
      nombre: '',
      correo: '',
      celular: '',
      programacion: [],
      autocompletado: false
    };
  };

  const actualizarCampo = (id, campo, valor) => {
    setInstructores(prev => prev.map(inst => (inst.id === id ? { ...inst, [campo]: valor } : inst)));
  };

  const agregarInstructor = () => {
    // Verificar si ya hay 3 instructores (Técnico, Empresarial, Popular)
    const rolesExistentes = instructores.map(inst => inst.tipo);
    const rolesDisponiblesParaAgregar = ['Técnico', 'Empresarial', 'Popular'].filter(r => !rolesExistentes.includes(r));
    
    if (rolesDisponiblesParaAgregar.length === 0 && !instructores.some(inst => inst.tipo === 'Otro')) {
      alert('⚠️ Ya tienes los 3 roles de instructores asignados (Técnico, Empresarial, Popular). No puedes agregar más instructores.');
      return;
    }
    
    setInstructores(prev => [...prev, inicializarInstructor()]);
  };

  const eliminarInstructor = (id) => {
    const instructorAEliminar = instructores.find(inst => inst.id === id);
    if (instructorAEliminar?.autocompletado) {
      alert('⚠️ No puedes eliminar el instructor autocompletado desde tu perfil. Si deseas cambiarlo, usa el botón "Cambiar selección".');
      return;
    }
    setInstructores(prev => prev.filter(inst => inst.id !== id));
  };

  const agregarMes = (id) => {
    setInstructores(prev => prev.map(inst => {
      if (inst.id !== id) return inst;
      const nuevo = { ...inst };
      nuevo.programacion = [...nuevo.programacion, { mes: nuevo.programacion.length + 1, rangos: [] }];
      return nuevo;
    }));
  };

  const agregarRango = (id, indexMes) => {
    setInstructores(prev => prev.map(inst => {
      if (inst.id !== id) return inst;
      const nuevo = { ...inst };
      nuevo.programacion = nuevo.programacion.map((mes, idx) => {
        if (idx !== indexMes) return mes;
        return {
          ...mes,
          rangos: [...mes.rangos, { desde: '', hasta: '', hora_inicio: '08:00', hora_fin: '16:00' }]
        };
      });
      return nuevo;
    }));
  };

  const actualizarRango = (id, indexMes, indexRango, campo, valor) => {
    setInstructores(prev => prev.map(inst => {
      if (inst.id !== id) return inst;
      const nuevo = { ...inst };
      nuevo.programacion = nuevo.programacion.map((mes, idxMes) => {
        if (idxMes !== indexMes) return mes;
        return {
          ...mes,
          rangos: mes.rangos.map((rango, idxRango) => (
            idxRango === indexRango ? { ...rango, [campo]: valor } : rango
          ))
        };
      });
      return nuevo;
    }));
  };

  const eliminarRango = (id, indexMes, indexRango) => {
    setInstructores(prev => prev.map(inst => {
      if (inst.id !== id) return inst;
      const nuevo = { ...inst };
      nuevo.programacion = nuevo.programacion.map((mes, idxMes) => {
        if (idxMes !== indexMes) return mes;
        return {
          ...mes,
          rangos: mes.rangos.filter((_, idxRango) => idxRango !== indexRango)
        };
      });
      return nuevo;
    }));
  };

  const eliminarMes = (id, indexMes) => {
    setInstructores(prev => prev.map(inst => {
      if (inst.id !== id) return inst;
      const nuevo = { ...inst };
      nuevo.programacion = nuevo.programacion
        .filter((_, idxMes) => idxMes !== indexMes)
        .map((mes, idx) => ({ ...mes, mes: idx + 1 }));
      return nuevo;
    }));
  };

  const calcularHorasInstructor = (instructor) => {
    let total = 0;
    instructor.programacion.forEach(mes => {
      mes.rangos.forEach(rango => {
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
    return total;
  };

  const validarProgramacion = () => {
    const errores = [];
    const totalHoras = instructores.reduce((sum, inst) => sum + calcularHorasInstructor(inst), 0);

    if (instructores.length === 0) {
      errores.push('Debe agregar al menos un instructor');
    }

    // Verificar que los 3 roles principales estén presentes si hay programa Campesena
    const rolesPresentes = instructores.map(inst => inst.tipo);
    const rolesRequeridos = ['Técnico', 'Empresarial', 'Popular'];
    const rolesFaltantes = rolesRequeridos.filter(r => !rolesPresentes.includes(r));
    
    if (rolesFaltantes.length > 0 && !instructores.some(inst => inst.tipo === 'Otro')) {
      errores.push(`Faltan los siguientes roles de instructores: ${rolesFaltantes.join(', ')}`);
    }

    instructores.forEach((instructor, idx) => {
      if (!instructor.nombre) {
        errores.push(`Instructor ${idx + 1}: El nombre es obligatorio`);
      }
      if (!instructor.identificacion) {
        errores.push(`Instructor ${idx + 1}: La identificación es obligatoria`);
      }
      if (!instructor.correo) {
        errores.push(`Instructor ${idx + 1}: El correo es obligatorio`);
      }
      if (!instructor.celular) {
        errores.push(`Instructor ${idx + 1}: El celular es obligatorio`);
      }
      if (instructor.programacion.length === 0) {
        errores.push(`Instructor ${idx + 1}: debe agregar al menos un mes de programación.`);
      }

      instructor.programacion.forEach(mes => {
        if (mes.rangos.length === 0) {
          errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}: debe agregar al menos un rango.`);
        }

        mes.rangos.forEach((rango, rIdx) => {
          if (!rango.desde || !rango.hasta) {
            errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}, Rango ${rIdx + 1}: fechas incompletas.`);
          }
          if (rango.desde && rango.hasta) {
            const desde = new Date(rango.desde);
            const hasta = new Date(rango.hasta);
            if (hasta < desde) {
              errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}, Rango ${rIdx + 1}: hasta debe ser posterior a desde.`);
            }
          }
          if (rango.hora_inicio && rango.hora_fin) {
            const [hi, mi] = rango.hora_inicio.split(':').map(Number);
            const [hf, mf] = rango.hora_fin.split(':').map(Number);
            const inicio = hi * 60 + mi;
            const fin = hf * 60 + mf;
            if (fin <= inicio) {
              errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}, Rango ${rIdx + 1}: hora fin debe ser mayor que hora inicio.`);
            }
            if (fin - inicio < 60) {
              errores.push(`Instructor ${idx + 1}, Mes ${mes.mes}, Rango ${rIdx + 1}: el rango debe durar al menos 1 hora.`);
            }
          }
        });
      });
    });

    if (Math.abs(totalHoras - horasPrograma) > 0.1 && horasPrograma > 0) {
      errores.push(`Total de horas programadas (${totalHoras.toFixed(1)}) no coincide con el programa (${horasPrograma}).`);
    }

    return errores;
  };

  const handleValidacion = () => {
    const errores = validarProgramacion();
    if (errores.length > 0) {
      alert('❌ Errores encontrados:\n- ' + errores.join('\n- '));
    } else {
      alert('✅ Validación correcta. La programación cumple con los requisitos.');
    }
  };

  const resumenHoras = instructores.reduce((acc, inst) => {
    const horas = calcularHorasInstructor(inst);
    acc[inst.tipo] = (acc[inst.tipo] || 0) + horas;
    return acc;
  }, {});

  const totalHorasActual = Object.values(resumenHoras).reduce((sum, v) => sum + v, 0);
  const porcentajeHoras = horasPrograma > 0 ? Math.min(100, (totalHorasActual / horasPrograma) * 100) : 0;

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  };

  // Roles faltantes para mostrar advertencia
  const rolesRequeridos = ['Técnico', 'Empresarial', 'Popular'];
  const rolesPresentes = instructores.map(inst => inst.tipo);
  const rolesFaltantes = rolesRequeridos.filter(r => !rolesPresentes.includes(r));

  return (
    <div className="mt-6 space-y-6">
      {/* Selector de rol del usuario autenticado */}
      {mostrarSelectorRol && usuarioActual && (
        <div className="bg-gradient-to-r from-[#006c49]/5 to-[#00275b]/5 p-6 rounded-xl border-2 border-[#006c49]/30 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#006c49]/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#006c49]">person_add</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#091426]">¿Cuál es tu rol en esta oferta?</h3>
              <p className="text-sm text-[#45474c]">
                Selecciona tu rol para autocompletar automáticamente tus datos como instructor
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {rolesDisponibles.map(rol => (
              <button
                key={rol.value}
                type="button"
                onClick={() => handleRolChange(rol.value)}
                disabled={isRolOcupado(rol.value, null)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  isRolOcupado(rol.value, null) 
                    ? 'border-gray-300 bg-gray-100 opacity-50 cursor-not-allowed'
                    : rolSeleccionado === rol.value
                      ? 'border-[#006c49] bg-[#006c49]/10 shadow-md'
                      : 'border-[#c5c6cd] hover:border-[#006c49] hover:bg-[#006c49]/5'
                }`}
              >
                <div className="text-2xl mb-2">{rol.label.split(' ')[0]}</div>
                <div className="font-semibold text-[#091426]">{rol.label}</div>
                <p className="text-xs text-[#45474c] mt-1">{rol.description}</p>
                {isRolOcupado(rol.value, null) && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Ya asignado</p>
                )}
              </button>
            ))}
          </div>

          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={() => setMostrarSelectorRol(false)}
              className="text-sm text-[#75777d] hover:text-[#006c49] underline"
            >
              Omitir (llenar instructores manualmente)
            </button>
          </div>
        </div>
      )}

      {/* Mostrar datos del usuario autenticado si ya seleccionó rol */}
      {rolSeleccionado && usuarioActual && instructores.some(inst => inst.tipo === rolSeleccionado && inst.autocompletado) && (
        <div className="bg-white p-4 rounded-xl border border-[#006c49]/30 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#006c49]">badge</span>
              <h4 className="font-semibold text-[#091426]">Tus datos serán registrados como instructor {rolSeleccionado}</h4>
            </div>
            <button
              type="button"
              onClick={() => {
                const instructorAutocompletado = instructores.find(inst => inst.tipo === rolSeleccionado && inst.autocompletado);
                if (instructorAutocompletado) {
                  setInstructores(prev => prev.filter(inst => inst.id !== instructorAutocompletado.id));
                }
                setRolSeleccionado('');
                setMostrarSelectorRol(true);
                setAutocompletadoRealizado(false);
              }}
              className="text-xs text-[#ba1a1a] hover:underline"
            >
              Cambiar selección
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-[#45474c]">Nombre</p>
              <p className="font-medium">{usuarioActual.nombre} {usuarioActual.apellido}</p>
            </div>
            <div>
              <p className="text-xs text-[#45474c]">Documento</p>
              <p className="font-medium">{usuarioActual.numeroIdentificacion}</p>
            </div>
            <div>
              <p className="text-xs text-[#45474c]">Correo</p>
              <p className="font-medium truncate">{usuarioActual.correoElectronico}</p>
            </div>
            <div>
              <p className="text-xs text-[#45474c]">Teléfono</p>
              <p className="font-medium">{usuarioActual.telefono}</p>
            </div>
          </div>
        </div>
      )}

      {/* Resumen Superior */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#c5c6cd]/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#00275b]/10 flex items-center justify-center text-[#00275b]">
            <span className="material-symbols-outlined">schedule</span>
          </div>
          <div>
            <p className="text-xs font-medium text-[#45474c] uppercase tracking-wider">Horas requeridas</p>
            <p className="text-2xl font-semibold text-[#091426]">{horasPrograma} Horas</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#c5c6cd]/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-[#006c49]/20 flex items-center justify-center text-[#006c49]">
            <span className="material-symbols-outlined">date_range</span>
          </div>
          <div>
            <p className="text-xs font-medium text-[#45474c] uppercase tracking-wider">Fechas del programa</p>
            <p className="text-sm font-semibold text-[#091426]">
              {fechasInicio ? formatFecha(fechasInicio) : 'N/A'} - {fechasFin ? formatFecha(fechasFin) : 'N/A'}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border-2 border-[#006c49]/20 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <span className="material-symbols-outlined text-6xl">bolt</span>
          </div>
          <div className="w-12 h-12 rounded-lg bg-[#006c49] flex items-center justify-center text-white">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div>
            <p className="text-xs font-medium text-[#45474c] uppercase tracking-wider">Total actual</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-semibold text-[#006c49]">{totalHorasActual.toFixed(1)}</p>
              <p className="text-sm text-[#45474c]">/ {horasPrograma} hrs</p>
            </div>
            <div className="w-32 h-1.5 bg-[#e5eeff] rounded-full mt-1 overflow-hidden">
              <div className="bg-[#006c49] h-full rounded-full transition-all duration-500" style={{ width: `${porcentajeHoras}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Advertencia de roles faltantes */}
      {rolesFaltantes.length > 0 && instructores.length > 0 && (
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-sm text-amber-700">
            ⚠️ <strong>Roles faltantes:</strong> {rolesFaltantes.join(', ')}
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Recuerda que debes tener un instructor de cada tipo: Técnico, Empresarial y Popular
          </p>
        </div>
      )}

      {/* Sección de Instructores */}
      <div className="space-y-5">
        {instructores.length === 0 && !autocompletadoRealizado ? (
          <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-[#c5c6cd]/50">
            <span className="material-symbols-outlined text-5xl text-[#75777d] mb-3">group_off</span>
            <p className="text-[#45474c]">No hay instructores agregados</p>
            <p className="text-sm text-[#75777d] mt-1">Selecciona tu rol arriba o haz clic en "Agregar instructor"</p>
          </div>
        ) : (
          instructores.map((instructor, idx) => (
            <div key={instructor.id} className="bg-white rounded-xl border border-[#c5c6cd]/20 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
              {/* Card Header */}
              <div className="px-5 py-3 bg-[#eff4ff] border-b border-[#c5c6cd]/30 flex justify-between items-center flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#006c49]">person</span>
                  <h3 className="text-base font-bold text-[#091426]">Instructor {idx + 1}</h3>
                  {instructor.autocompletado && (
                    <span className="bg-[#6cf8bb]/30 text-[#005236] px-2 py-0.5 text-xs rounded font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">verified</span>
                      TÚ
                    </span>
                  )}
                  {idx === 0 && !instructor.autocompletado && instructores.length > 0 && (
                    <span className="bg-[#dce9ff] text-[#0b1c30] px-2 py-0.5 text-xs rounded font-medium">PRINCIPAL</span>
                  )}
                </div>
                {!instructor.autocompletado && (
                  <button 
                    type="button" 
                    onClick={() => eliminarInstructor(instructor.id)}
                    className="flex items-center gap-1 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 px-3 py-1 rounded-lg transition-colors text-sm font-medium"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Eliminar
                  </button>
                )}
                {instructor.autocompletado && (
                  <span className="text-xs text-[#006c49] bg-[#006c49]/10 px-3 py-1 rounded-full">
                    Autocompletado desde tu perfil
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-5">
                {/* Información básica */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#45474c]">Tipo de instructor *</label>
                    <select 
                      value={instructor.tipo} 
                      onChange={(e) => actualizarCampo(instructor.id, 'tipo', e.target.value)}
                      className="w-full bg-white border border-[#c5c6cd] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none transition-all"
                      disabled={instructor.autocompletado}
                    >
                      <option value="Técnico" disabled={isRolOcupado('Técnico', instructor.id)}>
                        Técnico {isRolOcupado('Técnico', instructor.id) ? '(Ya asignado)' : ''}
                      </option>
                      <option value="Empresarial" disabled={isRolOcupado('Empresarial', instructor.id)}>
                        Empresarial {isRolOcupado('Empresarial', instructor.id) ? '(Ya asignado)' : ''}
                      </option>
                      <option value="Popular" disabled={isRolOcupado('Popular', instructor.id)}>
                        Popular {isRolOcupado('Popular', instructor.id) ? '(Ya asignado)' : ''}
                      </option>
                      <option value="Otro">Otro</option>
                    </select>
                    {instructor.autocompletado && (
                      <p className="text-xs text-[#006c49] mt-1">✓ Este instructor fue autocompletado desde tu perfil</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#45474c]">Tipo de documento *</label>
                    <select 
                      value={instructor.tipo_identificacion} 
                      onChange={(e) => actualizarCampo(instructor.id, 'tipo_identificacion', e.target.value)}
                      className="w-full bg-white border border-[#c5c6cd] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none transition-all"
                      disabled={instructor.autocompletado}
                    >
                      <option value="CC">CC</option>
                      <option value="CE">CE</option>
                      <option value="TI">TI</option>
                      <option value="PAP">PAP</option>
                      <option value="NIT">NIT</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#45474c]">Identificación *</label>
                    <input 
                      type="text" 
                      value={instructor.identificacion} 
                      onChange={(e) => actualizarCampo(instructor.id, 'identificacion', e.target.value)}
                      className="w-full bg-white border border-[#c5c6cd] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none transition-all"
                      placeholder="12345678"
                      disabled={instructor.autocompletado}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#45474c]">Nombre completo *</label>
                    <input 
                      type="text" 
                      value={instructor.nombre} 
                      onChange={(e) => actualizarCampo(instructor.id, 'nombre', e.target.value)}
                      className="w-full bg-white border border-[#c5c6cd] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none transition-all"
                      placeholder="Nombre completo"
                      disabled={instructor.autocompletado}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#45474c]">Correo electrónico *</label>
                    <input 
                      type="email" 
                      value={instructor.correo} 
                      onChange={(e) => actualizarCampo(instructor.id, 'correo', e.target.value)}
                      className="w-full bg-white border border-[#c5c6cd] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none transition-all"
                      placeholder="correo@ejemplo.com"
                      disabled={instructor.autocompletado}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#45474c]">Celular *</label>
                    <input 
                      type="tel" 
                      value={instructor.celular} 
                      onChange={(e) => actualizarCampo(instructor.id, 'celular', e.target.value)}
                      className="w-full bg-white border border-[#c5c6cd] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none transition-all"
                      placeholder="3001234567"
                      disabled={instructor.autocompletado}
                    />
                  </div>
                </div>

                {/* Programación Mensual */}
                <div className="border-t border-[#c5c6cd]/30 pt-4">
                  <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                    <h4 className="text-lg font-semibold text-[#091426] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006c49]">event_note</span>
                      Programación Mensual
                    </h4>
                    <button 
                      type="button" 
                      onClick={() => agregarMes(instructor.id)}
                      className="flex items-center gap-2 bg-[#00275b]/10 text-[#00275b] px-4 py-2 rounded-lg font-medium text-sm hover:bg-[#00275b]/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">calendar_add_on</span>
                      + Agregar mes
                    </button>
                  </div>

                  {instructor.programacion.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-[#c5c6cd] rounded-xl bg-[#eff4ff]/30">
                      <p className="text-sm text-[#45474c]">No hay meses agregados. Presiona "+ Agregar mes" para comenzar.</p>
                    </div>
                  )}

                  {instructor.programacion.map((mes, mIdx) => (
                    <div key={mIdx} className="bg-[#eff4ff]/50 p-4 rounded-xl border border-[#c5c6cd]/30 mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-base font-semibold text-[#091426] border-l-4 border-[#006c49] pl-3">
                          {`${new Date().getFullYear()} - Mes ${mes.mes}`}
                        </h5>
                        <button 
                          type="button" 
                          onClick={() => eliminarMes(instructor.id, mIdx)}
                          className="p-1 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 rounded-full transition-colors"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {mes.rangos.map((rango, rIdx) => (
                          <div key={rIdx} className="bg-white p-3 rounded-lg border border-[#c5c6cd]/40 relative group">
                            <button 
                              type="button" 
                              onClick={() => eliminarRango(instructor.id, mIdx, rIdx)}
                              className="absolute -top-2 -right-2 bg-[#ba1a1a] text-white w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            >
                              <span className="material-symbols-outlined text-xs">delete</span>
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-medium text-[#45474c]">Desde</label>
                                <input 
                                  type="date" 
                                  value={rango.desde} 
                                  onChange={(e) => actualizarRango(instructor.id, mIdx, rIdx, 'desde', e.target.value)}
                                  className="w-full text-sm border border-[#c5c6cd] rounded-md p-1.5 focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-medium text-[#45474c]">Hasta</label>
                                <input 
                                  type="date" 
                                  value={rango.hasta} 
                                  onChange={(e) => actualizarRango(instructor.id, mIdx, rIdx, 'hasta', e.target.value)}
                                  className="w-full text-sm border border-[#c5c6cd] rounded-md p-1.5 focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-medium text-[#45474c]">Hora inicio</label>
                                <input 
                                  type="time" 
                                  value={rango.hora_inicio} 
                                  onChange={(e) => actualizarRango(instructor.id, mIdx, rIdx, 'hora_inicio', e.target.value)}
                                  className="w-full text-sm border border-[#c5c6cd] rounded-md p-1.5 focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] uppercase font-medium text-[#45474c]">Hora fin</label>
                                <input 
                                  type="time" 
                                  value={rango.hora_fin} 
                                  onChange={(e) => actualizarRango(instructor.id, mIdx, rIdx, 'hora_fin', e.target.value)}
                                  className="w-full text-sm border border-[#c5c6cd] rounded-md p-1.5 focus:ring-2 focus:ring-[#006c49]/20 focus:border-[#006c49] outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button 
                          type="button" 
                          onClick={() => agregarRango(instructor.id, mIdx)}
                          className="border-2 border-dashed border-[#c5c6cd] rounded-lg flex flex-col items-center justify-center p-3 text-[#45474c] hover:bg-[#eff4ff] hover:border-[#006c49] transition-all group"
                        >
                          <span className="material-symbols-outlined text-2xl group-hover:text-[#006c49]">add_circle</span>
                          <span className="text-xs font-medium">Agregar rango</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Acciones Globales */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-5 rounded-xl border border-[#c5c6cd]/30 sticky bottom-4 shadow-lg z-30 gap-4">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2 overflow-hidden">
            {instructores.slice(0, 3).map((inst, idx) => (
              <div key={idx} className="w-8 h-8 rounded-full bg-[#006c49]/10 flex items-center justify-center ring-2 ring-white text-[#006c49] text-xs font-bold">
                {(inst.nombre?.charAt(0) || 'I')}
              </div>
            ))}
            {instructores.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-[#dce9ff] flex items-center justify-center ring-2 ring-white text-[#006c49] text-xs font-bold">
                +{instructores.length - 3}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-[#091426]">Resumen de Carga</p>
            <p className="text-xs text-[#45474c]">{instructores.length} instructor(es) asignados</p>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            type="button" 
            onClick={agregarInstructor}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#00275b] text-white rounded-xl font-medium text-sm hover:opacity-90 transition-all"
          >
            <span className="material-symbols-outlined text-sm">group_add</span>
            Agregar instructor
          </button>
          <button 
            type="button" 
            onClick={handleValidacion}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#006c49] text-white rounded-xl font-medium text-sm hover:bg-[#004a2b] transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-sm">verified</span>
            Validar programación
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormularioCampesenaCompleto;