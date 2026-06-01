const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Coordinador = require('../models/Coordinador');
const Funcionario = require('../models/Funcionario'); 

// REGISTRO DE USUARIO (solo para instructores)
const registerUser = async (req, res) => {
  try {
    const {
      nombreUsuario,
      tipoIdentificacion,
      numeroIdentificacion,
      nombre,
      apellido,
      telefono,
      correoElectronico,
      coordinadorAsignado,
      password
    } = req.body;

    // Verificar si ya existe
    const userExists = await User.findOne({
      $or: [
        { correoElectronico },
        { numeroIdentificacion },
        { nombreUsuario }
      ]
    });

    if (userExists) {
      return res.status(400).json({
        message: 'El usuario ya existe con esos datos'
      });
    }

    // Verificar que el coordinador existe
    const coordinadorExiste = await Coordinador.findById(coordinadorAsignado);
    if (!coordinadorExiste) {
      return res.status(400).json({
        message: 'El coordinador seleccionado no existe'
      });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      nombreUsuario,
      tipoIdentificacion,
      numeroIdentificacion,
      nombre,
      apellido,
      telefono,
      correoElectronico,
      coordinadorAsignado,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({
      message: 'Usuario registrado correctamente',
      user: {
        id: user._id,
        nombreUsuario: user.nombreUsuario,
        correoElectronico: user.correoElectronico,
        coordinadorAsignado: {
          id: coordinadorExiste._id,
          nombre: coordinadorExiste.nombre
        }
      }
    });

  } catch (error) {
    console.log('Error en registro:', error);
    res.status(500).json({
      message: 'Error en el servidor',
      error: error.message
    });
  }
};

// ===== LOGIN UNIFICADO (instructores, coordinadores y funcionarios) =====
const loginUnificado = async (req, res) => {
  try {
    const { correoElectronico, password } = req.body;

    // 1️⃣ Buscar primero en instructores (User)
    let user = await User.findOne({ correoElectronico })
      .populate('coordinadorAsignado', 'nombre');
    let tipo = 'instructor';

    // 2️⃣ Si no está en instructores, buscar en coordinadores
    if (!user) {
      user = await Coordinador.findOne({ correoElectronico });
      tipo = 'coordinador';
    }

    // 3️⃣ Si no está en coordinadores, buscar en funcionarios
    if (!user) {
      user = await Funcionario.findOne({ correoElectronico })
        .populate('modalidades', 'nombre');
      tipo = 'funcionario';
    }

    // 4️⃣ Si no está en ninguna parte
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // 5️⃣ Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // 6️⃣ Crear token
    const token = jwt.sign(
      { 
        id: user._id,
        tipo: tipo
      },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // 7️⃣ Respuesta según el tipo
    if (tipo === 'coordinador') {
      res.json({
        success: true,
        message: 'Login exitoso',
        token,
        user: {
          id: user._id,
          nombreUsuario: user.nombreUsuario,
          correoElectronico: user.correoElectronico,
          nombre: user.nombre,
          tipo: 'coordinador'
        }
      });
    } else if (tipo === 'funcionario') {
      const modalidades = user.modalidades.map(m => m.nombre);
      
      res.json({
        success: true,
        message: 'Login exitoso',
        token,
        user: {
          id: user._id,
          nombreUsuario: user.nombreUsuario,
          correoElectronico: user.correoElectronico,
          nombre: user.nombre,
          tipo: 'funcionario',
          tipo_funcionario: modalidades.includes('Campesena') ? 'campesena' : 'regular',
          modalidades: modalidades
        }
      });
    } else {
      res.json({
        success: true,
        message: 'Login exitoso',
        token,
        user: {
          id: user._id,
          nombreUsuario: user.nombreUsuario,
          correoElectronico: user.correoElectronico,
          nombre: user.nombre,
          apellido: user.apellido,
          tipo: 'instructor',
          coordinadorAsignado: user.coordinadorAsignado
        }
      });
    }

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor'
    });
  }
};

// ===== OBTENER USUARIO ACTUAL (para el frontend) =====
const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.tipo;
    
    console.log('🔍 Obteniendo usuario actual:', { userId, userType });
    
    let user = null;
    let userData = {};
    
    if (userType === 'instructor') {
      user = await User.findById(userId)
        .populate('tipoIdentificacion')
        .select('-password');
      
      if (user) {
        userData = {
          id: user._id,
          nombre: user.nombre,
          apellido: user.apellido || '',
          numeroIdentificacion: user.numeroIdentificacion,
          correoElectronico: user.correoElectronico,
          telefono: user.telefono || '',
          tipoIdentificacion: user.tipoIdentificacion || { siglas: 'CC' },
          tipo: 'instructor'
        };
      }
    } 
    else if (userType === 'coordinador') {
      user = await Coordinador.findById(userId).select('-password');
      
      if (user) {
        userData = {
          id: user._id,
          nombre: user.nombre,
          apellido: '',
          numeroIdentificacion: user.identificacion || '',
          correoElectronico: user.correoElectronico,
          telefono: user.telefono || '',
          tipoIdentificacion: { siglas: 'CC' },
          tipo: 'coordinador'
        };
      }
    } 
    else if (userType === 'funcionario') {
      user = await Funcionario.findById(userId)
        .populate('modalidades')
        .select('-password');
      
      if (user) {
        userData = {
          id: user._id,
          nombre: user.nombre,
          apellido: '',
          numeroIdentificacion: user.identificacion || '',
          correoElectronico: user.correoElectronico,
          telefono: user.telefono || '',
          tipoIdentificacion: { siglas: 'CC' },
          tipo: 'funcionario',
          modalidades: user.modalidades || []
        };
      }
    }
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    console.log('✅ Usuario encontrado:', userData.nombre);
    
    res.json({
      success: true,
      data: userData
    });
    
  } catch (error) {
    console.error('❌ Error en getCurrentUser:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  registerUser,
  loginUnificado,
  getCurrentUser
};