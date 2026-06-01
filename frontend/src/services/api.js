import axios from 'axios';

// 🚨 IMPORTANTE: Usa URL relativa para que pase por el proxy
const api = axios.create({
  baseURL: '/api',  // ¡ASÍ! Sin localhost, sin puerto
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📡 Petición a:', config.baseURL + config.url); // Para depurar
    return config;
  },
  (error) => Promise.reject(error)
);

// Servicio de autenticación
export const authService = {
  login: async (correoElectronico, password) => {
    try {
      const response = await api.post('/auth/login', {
        correoElectronico,
        password
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // En authService.login
login: async (correoElectronico, password) => {
  try {
    const response = await api.post('/auth/login', {
      correoElectronico,
      password
    });
    
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      localStorage.setItem('userType', response.data.user.tipo); // Guardar tipo
    }
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
},


  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

export default api;