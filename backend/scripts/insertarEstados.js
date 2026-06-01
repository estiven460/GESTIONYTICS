// backend/scripts/insertarEstados.js
const mongoose = require('mongoose');
const EstadoOferta = require('../models/EstadoOferta');
require('dotenv').config();

const estados = [
  // ===== ESTADOS GENERALES =====
  {
    codigo: 'pendiente',
    nombre: 'Pendiente',
    descripcion: 'La oferta está lista para ser enviada al coordinador',
    color: '#f39c12',
    orden: 1,
    permite_edicion: false,
    notificar_instructor: false,
    notificar_coordinador: true,
    notificar_funcionario: false,
    activo: true
  },
  {
    codigo: 'rechazada',
    nombre: 'Rechazada',
    descripcion: 'El coordinador rechazó la oferta',
    color: '#e74c3c',
    orden: 2,
    permite_edicion: true,
    notificar_instructor: true,
    notificar_coordinador: false,
    notificar_funcionario: false,
    activo: true
  },
  {
    codigo: 'aprobada',
    nombre: 'Aprobada',
    descripcion: 'El coordinador aprobó la oferta',
    color: '#27ae60',
    orden: 3,
    permite_edicion: false,
    notificar_instructor: true,
    notificar_coordinador: false,
    notificar_funcionario: true,
    activo: true
  },
  {
    codigo: 'ficha_creada_antigua',
    nombre: 'Ficha Creada',
    descripcion: 'El funcionario creó la ficha en Sofía Plus',
    color: '#2980b9',
    orden: 4,
    permite_edicion: false,
    notificar_instructor: true,
    notificar_coordinador: false,
    notificar_funcionario: false,
    activo: true
  },
  {
    codigo: 'con_inscritos',
    nombre: 'Con Inscritos',
    descripcion: 'Ya hay aprendices inscritos',
    color: '#8e44ad',
    orden: 5,
    permite_edicion: false,
    notificar_instructor: true,
    notificar_coordinador: false,
    notificar_funcionario: false,
    activo: true
  },
  {
    codigo: 'completada',
    nombre: 'Completada',
    descripcion: 'Aprendices matriculados, oferta finalizada',
    color: '#2c3e50',
    orden: 6,
    permite_edicion: false,
    notificar_instructor: true,
    notificar_coordinador: false,
    notificar_funcionario: false,
    activo: true
  },

  // ===== ESTADOS ADMINISTRATIVOS (Estado Administración Educativa) =====
  {
    codigo: 'lista_espera',
    nombre: 'Lista de espera',
    descripcion: 'Oferta aprobada, en espera de revisión por el funcionario',
    color: '#3498db',
    orden: 10,
    permite_edicion: true,
    notificar_instructor: false,
    notificar_coordinador: false,
    notificar_funcionario: true,
    activo: true
  },
  {
    codigo: 'proceso_creacion',
    nombre: 'Proceso de creación',
    descripcion: 'El funcionario está creando la oferta en el sistema',
    color: '#f39c12',
    orden: 11,
    permite_edicion: true,
    notificar_instructor: false,
    notificar_coordinador: false,
    notificar_funcionario: true,
    activo: true
  },
  {
    codigo: 'creada',
    nombre: 'Creada',
    descripcion: 'La oferta ha sido creada exitosamente',
    color: '#27ae60',
    orden: 12,
    permite_edicion: true,
    notificar_instructor: true,
    notificar_coordinador: false,
    notificar_funcionario: true,
    activo: true
  },
  {
    codigo: 'en_revision',
    nombre: 'En revisión',
    descripcion: 'El instructor está revisando la selección de aspirantes',
    color: '#e74c3c',
    orden: 13,
    permite_edicion: false,
    notificar_instructor: true,
    notificar_coordinador: false,
    notificar_funcionario: true,
    activo: true
  },
  // ===== NUEVOS ESTADOS ADMINISTRATIVOS PARA EL FLUJO DE FICHA =====
  {
    codigo: 'ficha_proceso_creacion',
    nombre: 'Ficha en proceso de creación',
    descripcion: 'El funcionario está revisando los documentos para crear la ficha',
    color: '#f39c12',
    orden: 15,
    permite_edicion: false,
    notificar_instructor: false,
    notificar_coordinador: false,
    notificar_funcionario: true,
    activo: true
  },
  {
    codigo: 'ficha_creada',
    nombre: 'Ficha creada',
    descripcion: 'El funcionario ha creado la ficha y enviado el Excel al instructor',
    color: '#3498db',
    orden: 16,
    permite_edicion: false,
    notificar_instructor: true,
    notificar_coordinador: false,
    notificar_funcionario: true,
    activo: true
  },
  {
    codigo: 'validacion_instructor',
    nombre: 'Validación por instructor',
    descripcion: 'El instructor está validando los aspirantes para matrícula',
    color: '#8e44ad',
    orden: 17,
    permite_edicion: false,
    notificar_instructor: true,
    notificar_coordinador: false,
    notificar_funcionario: true,
    activo: true
  },
  {
    codigo: 'matriculados',
    nombre: 'Ficha matriculada',
    descripcion: 'Los aprendices aprobados ya están matriculados',
    color: '#27ae60',
    orden: 18,
    permite_edicion: false,
    notificar_instructor: true,
    notificar_coordinador: false,
    notificar_funcionario: true,
    activo: true
  }
];

const insertarEstados = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    await EstadoOferta.deleteMany({});
    console.log('🗑️ Estados anteriores eliminados');

    const result = await EstadoOferta.insertMany(estados);
    console.log(`✅ ${result.length} estados insertados:`);
    
    console.log('\n📋 ESTADOS ADMINISTRATIVOS (Nuevos):');
    const nuevos = result.filter(e => e.orden >= 15);
    nuevos.forEach(estado => {
      console.log(`   - ${estado.nombre} (${estado.codigo})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

insertarEstados();