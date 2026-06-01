const mongoose = require('mongoose');

const creacionOfertaSchema = new mongoose.Schema({
  programa_formacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProgramaFormacion',
    required: [true, 'El programa de formación es obligatorio']
  },
  
  modalidad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Modalidad',
    required: [true, 'La modalidad es obligatoria']
  },
  duracion_meses: {
    type: Number,
    required: [true, 'La duración en meses es obligatoria'],
    min: 1,
    max: 12
  },
  es_campesena: {
    type: Boolean,
    default: false
  },

  tipo_programa: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoPrograma',
    required: [true, 'El tipo de programa es obligatorio']
  },
  
  tipo_oferta: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TipoOferta',
    required: [true, 'El tipo de oferta es obligatorio']
  },
  
  cupo_maximo: {
    type: Number,
    required: [true, 'El cupo máximo es obligatorio'],
    min: [1, 'El cupo mínimo debe ser 1']
  },
  
  cupos_disponibles: {
    type: Number,
    min: 0,
    default: function() {
      return this.cupo_maximo;
    }
  },
  
  ambiente: {
    nombre: {
      type: String,
      required: [true, 'El nombre del ambiente es obligatorio']
    }
  },
  
  fechas: {
    inicio: {
      type: Date,
      required: [true, 'La fecha de inicio es obligatoria']
    },
    fin: {
      type: Date,
      required: [true, 'La fecha de fin es obligatoria']
    }
  },
  
  ubicacion: {
    departamento: {
      type: String,
      default: 'Cauca',
      required: true
    },
    municipio: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Municipio',
      required: [true, 'El municipio es obligatorio']
    },
    direccion: {
      type: String,
      required: [true, 'La dirección es obligatoria'],
      trim: true
    }
  },
  
  empresa_solicitante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Empresa',
    required: false,
    default: null
  },
  
  subsector_economico: {
    nombre: {
      type: String,
      required: [true, 'El subsector económico es obligatorio']
    }
  },
  
  programa_especial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProgramaEspecial'
  },
  
  convenio: {
    nombre: {
      type: String,
      required: [true, 'El nombre del convenio es obligatorio']
    }
  },
  
  horario: {
    hora_inicio: {
      type: String,
      required: function() {
        return !this.es_campesena;
      },
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
    },
    hora_fin: {
      type: String,
      required: function() {
        return !this.es_campesena;
      },
      match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Formato de hora inválido (HH:MM)']
    },
    dias: [{
      type: String,
      enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    }]
  },
  
  firma_digital: {
    tipo: {
      type: String,
      enum: ['digital', 'escaneada', 'electronica'],
      default: 'electronica'
    }
  },
  
  coordinador_asignado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coordinador',
    required: true
  },
  
  creado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  link_inscripciones: {
    type: String,
    unique: true,
    sparse: true
  },
  carta_pdf: {
    type: String
  },
  firma_digital_pdf: {
    type: String
  },
  instructor_nombre: {
    type: String,
    default: ''
  },
  instructor_correo: {
    type: String,
    default: ''
  },
  instructor_identificacion: {
    type: String,
    default: ''
  },
  instructor_telefono: {
    type: String,
    default: ''
  },
  
  estado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EstadoOferta',
    required: true
  },

  // ===== CAMPO COMENTARIO_RECHAZO =====
  comentario_rechazo: {
    type: String,
    default: null
  },

  // ===== NUEVOS CAMPOS PARA EL FLUJO DE FICHA =====
  excel_aspirantes_funcionario: {
    type: String,
    default: null
  },
  excel_aspirantes_validado: {
    type: String,
    default: null
  },
  confirmacion_matricula: {
    type: String,
    default: null
  },
  fecha_proceso_ficha: {
    type: Date,
    default: null
  },
  fecha_creacion_ficha: {
    type: Date,
    default: null
  },
  fecha_validacion_instructor: {
    type: Date,
    default: null
  },
  fecha_matricula_completada: {
    type: Date,
    default: null
  },
  observaciones_proceso: {
    type: String,
    default: ''
  },
  lista_aprobados: [{
    documento: String,
    nombre: String,
    observaciones: String
  }],
  lista_rechazados: [{
    documento: String,
    nombre: String,
    observaciones: String
  }],

  // ===== CAMPOS PARA ADMINISTRACIÓN EDUCATIVA =====
  estado_administrativo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EstadoOferta',
    default: null
  },
  archivo_seleccion: {
    type: String,
    default: null
  },
  captura_matricula: {
    type: String,
    default: null
  },
  observaciones_funcionario: {
    type: String,
    default: ''
  },
  historial_administrativo: [{
    estado: {
      type: String,
      enum: ['lista_espera', 'proceso_creacion', 'creada', 'matriculados', 'revision', 
             'ficha_proceso_creacion', 'ficha_creada', 'validacion_instructor']
    },
    comentario: String,
    cambiado_por: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Funcionario'
    },
    fecha: {
      type: Date,
      default: Date.now
    }
  }],

  historial_estados: [{
    estado: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EstadoOferta'
    },
    comentario: String,
    cambiado_por: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'cambiado_por_modelo'
    },
    cambiado_por_modelo: {
      type: String,
      enum: ['User', 'Coordinador', 'Funcionario']
    },
    fecha: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// ÍNDICES
creacionOfertaSchema.index({ 'programa_formacion': 1 });
creacionOfertaSchema.index({ 'modalidad': 1 });
creacionOfertaSchema.index({ 'tipo_programa': 1 });
creacionOfertaSchema.index({ 'coordinador_asignado': 1 });
creacionOfertaSchema.index({ 'empresa_solicitante': 1 });
creacionOfertaSchema.index({ 'estado': 1 });
creacionOfertaSchema.index({ 'fechas.inicio': 1 });
creacionOfertaSchema.index({ 'estado_administrativo': 1 });
creacionOfertaSchema.index({ 'comentario_rechazo': 1 });

const CreacionOferta = mongoose.model('CreacionOferta', creacionOfertaSchema);

module.exports = CreacionOferta;