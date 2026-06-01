import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import api from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({
    correoElectronico: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [enviandoRecuperacion, setEnviandoRecuperacion] = useState(false);
  const [mensajeRecuperacion, setMensajeRecuperacion] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.login(
        formData.correoElectronico,
        formData.password
      );

      console.log('Login exitoso:', response);

      if (response.user.tipo === 'funcionario') {
        navigate('/funcionario');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setError(error.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRecuperarPassword = async () => {
    const email = formData.correoElectronico;
    
    if (!email) {
      setMensajeRecuperacion('⚠️ Primero ingresa tu correo electrónico');
      setTimeout(() => setMensajeRecuperacion(''), 3000);
      return;
    }

    setEnviandoRecuperacion(true);
    setMensajeRecuperacion('');

    try {
      const response = await api.post('/password/solicitar', { email });
      setMensajeRecuperacion('✅ Se envió un correo de recuperación a tu cuenta registrada.');
      setTimeout(() => setMensajeRecuperacion(''), 5000);
    } catch (error) {
      setMensajeRecuperacion('❌ Error al enviar el correo. Intenta nuevamente.');
      setTimeout(() => setMensajeRecuperacion(''), 5000);
    } finally {
      setEnviandoRecuperacion(false);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      fontFamily: "'Inter', sans-serif"
    },
    main: {
      flexGrow: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px'
    },
    card: {
      backgroundColor: 'white',
      width: '100%',
      maxWidth: '440px',
      borderRadius: '12px',
      padding: '32px',
      border: '1px solid #bec9bf',
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
    },
    logoContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: '32px'
    },
    logo: {
      width: '96px',
      height: '96px',
      marginBottom: '16px',
      objectFit: 'contain'
    },
    title: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#00643c',
      textAlign: 'center',
      margin: 0
    },
    errorAlert: {
      backgroundColor: '#f8d7da',
      color: '#721c24',
      padding: '12px',
      borderRadius: '6px',
      marginBottom: '20px',
      textAlign: 'center',
      fontSize: '14px',
      borderLeft: '4px solid #ba1a1a'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    },
    formGroup: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    label: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#3f4942',
      marginBottom: '4px'
    },
    inputWrapper: {
      position: 'relative'
    },
    inputIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#6f7a71',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    input: {
      width: '100%',
      padding: '12px 12px 12px 40px',
      border: '1px solid #bec9bf',
      borderRadius: '8px',
      fontSize: '16px',
      outline: 'none',
      transition: 'all 0.2s',
      boxSizing: 'border-box',
      fontFamily: 'inherit'
    },
    passwordToggle: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#3f4942',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0
    },
    forgotLink: {
      textAlign: 'right',
      fontSize: '14px',
      fontWeight: '500',
      color: '#00643c',
      textDecoration: 'none',
      background: 'none',
      border: 'none',
      cursor: 'pointer'
    },
    button: {
      width: '100%',
      backgroundColor: '#00643c',
      color: 'white',
      fontWeight: 'bold',
      padding: '14px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    registerText: {
      textAlign: 'center',
      paddingTop: '16px',
      color: '#3f4942',
      fontSize: '16px'
    },
    registerLink: {
      color: '#00643c',
      fontWeight: 'bold',
      textDecoration: 'none'
    }
  };

  const iconStyle = {
    fontSize: '20px',
    fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20"
  };

  return (
    <div style={styles.container}>
      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.logoContainer}>
            <img
              alt="SENA Logo"
              style={styles.logo}
              src="/logosena.png"
            />
            <h1 style={styles.title}>Iniciar Sesión</h1>
          </div>

          {error && <div style={styles.errorAlert}>{error}</div>}

          <form style={styles.form} onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Correo electrónico</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>
                  <span className="material-symbols-outlined" style={iconStyle}>mail</span>
                </span>
                <input
                  type="email"
                  name="correoElectronico"
                  value={formData.correoElectronico}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder="ejemplo@sena.edu.co"
                  onFocus={(e) => e.target.style.borderColor = '#00643c'}
                  onBlur={(e) => e.target.style.borderColor = '#bec9bf'}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Contraseña</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>
                  <span className="material-symbols-outlined" style={iconStyle}>lock</span>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  style={styles.input}
                  placeholder="********"
                  onFocus={(e) => e.target.style.borderColor = '#00643c'}
                  onBlur={(e) => e.target.style.borderColor = '#bec9bf'}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  style={styles.passwordToggle}
                >
                  <span className="material-symbols-outlined" style={iconStyle}>
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                type="button"
                onClick={handleRecuperarPassword}
                disabled={enviandoRecuperacion}
                style={{
                  ...styles.forgotLink,
                  opacity: enviandoRecuperacion ? 0.6 : 1
                }}
              >
                {enviandoRecuperacion ? 'Enviando...' : '¿Olvidaste tu contraseña?'}
              </button>
            </div>

            {mensajeRecuperacion && (
              <div style={{
                marginTop: '8px',
                textAlign: 'center',
                fontSize: '13px',
                padding: '8px',
                borderRadius: '6px',
                backgroundColor: mensajeRecuperacion.includes('✅') ? '#d4edda' : mensajeRecuperacion.includes('⚠️') ? '#fff3cd' : '#f8d7da',
                color: mensajeRecuperacion.includes('✅') ? '#155724' : mensajeRecuperacion.includes('⚠️') ? '#856404' : '#721c24'
              }}>
                {mensajeRecuperacion}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                ...(loading ? { opacity: 0.8, cursor: 'not-allowed' } : {})
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.backgroundColor = '#004a2b';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.backgroundColor = '#00643c';
              }}
            >
              {loading ? 'Cargando...' : 'INICIAR SESIÓN'}
            </button>

            <div style={styles.registerText}>
              ¿No tienes una cuenta?{' '}
              <Link to="/registro" style={styles.registerLink}>
                Regístrate aquí
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default Login;