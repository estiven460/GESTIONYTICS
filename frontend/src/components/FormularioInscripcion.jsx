import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const FormularioInscripcion = () => {
  const { codigo } = useParams();
  const [loading, setLoading] = useState(false);
  const [loadingDatos, setLoadingDatos] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [caracterizaciones, setCaracterizaciones] = useState([]);
  const [oferta, setOferta] = useState(null);
  
  const [formData, setFormData] = useState({
    nombres: '',
    apellidos: '',
    tipo_documento: '',
    numero_documento: '',
    caracterizacion: '',
    telefono: '',
    correo: '',
    pdf_cedula: null
  });

  // ===== FUNCIÓN PARA DESCARGAR PDF (AHORA DENTRO DEL COMPONENTE) =====
  const descargarPDF = async (ofertaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get(`/ofertas/${ofertaId}/pdf`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ficha-${ofertaId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
    } catch (error) {
      console.error('Error descargando PDF:', error);
      alert('Error al descargar el PDF');
    }
  };

  useEffect(() => {
    console.log('🔑 Código de inscripción:', codigo);
    cargarDatosIniciales();
    cargarInfoOferta();
  }, [codigo]);

  const cargarDatosIniciales = async () => {
    try {
      console.log('📥 Cargando tipos de documento y caracterizaciones...');
      
      const [tiposDocRes, caracterizacionesRes] = await Promise.all([
        api.get('/tipos-documento'),
        api.get('/caracterizaciones')
      ]);

      console.log('✅ Tipos de documento (RAW):', tiposDocRes);
      console.log('✅ Tipos de documento (DATA):', tiposDocRes.data);
      console.log('✅ Tipos de documento (DATA.DATA):', tiposDocRes.data.data);
      
      console.log('✅ Caracterizaciones (RAW):', caracterizacionesRes);
      console.log('✅ Caracterizaciones (DATA):', caracterizacionesRes.data);
      console.log('✅ Caracterizaciones (DATA.DATA):', caracterizacionesRes.data.data);
      
      // Verificar que son arrays
      const tiposArray = Array.isArray(tiposDocRes.data.data) ? tiposDocRes.data.data : [];
      const caracArray = Array.isArray(caracterizacionesRes.data.data) ? caracterizacionesRes.data.data : [];
      
      console.log('✅ Tipos array length:', tiposArray.length);
      console.log('✅ Carac array length:', caracArray.length);
      
      setTiposDocumento(tiposArray);
      setCaracterizaciones(caracArray);
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      console.error('❌ Detalle:', error.response?.data);
      setError('Error al cargar datos del formulario');
    }
  };

  const getTiposDocumento = async (req, res) => {
    try {
      console.log('🔍 [PÚBLICA] Buscando tipos de documento...');
      const tipos = await TipoDoc.find();
      console.log(`✅ [PÚBLICA] Encontrados ${tipos.length} tipos de documento`);
      res.json({
        success: true,
        data: tipos
      });
    } catch (error) {
      console.error('❌ Error en getTiposDocumento:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  const getCaracterizaciones = async (req, res) => {
    try {
      console.log('🔍 [PÚBLICA] Buscando caracterizaciones...');
      const caracterizaciones = await Caracterizacion.find();
      console.log(`✅ [PÚBLICA] Encontradas ${caracterizaciones.length} caracterizaciones`);
      res.json({
        success: true,
        data: caracterizaciones
      });
    } catch (error) {
      console.error('❌ Error en getCaracterizaciones:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };




  const cargarInfoOferta = async () => {
    try {
      const response = await api.get(`/ofertas/link/${codigo}`);
      setOferta(response.data.data);
      console.log('✅ Oferta encontrada:', response.data.data);
    } catch (error) {
      console.error('Error cargando oferta:', error);
      setError('Link de inscripción no válido');
    } finally {
      setLoadingDatos(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      pdf_cedula: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!formData.nombres) throw new Error('Los nombres son obligatorios');
      if (!formData.apellidos) throw new Error('Los apellidos son obligatorios');
      if (!formData.tipo_documento) throw new Error('Seleccione un tipo de documento');
      if (!formData.numero_documento) throw new Error('El número de documento es obligatorio');
      if (!formData.caracterizacion) throw new Error('Seleccione una caracterización');
      if (!formData.telefono) throw new Error('El teléfono es obligatorio');
      if (!formData.correo) throw new Error('El correo es obligatorio');
      if (!formData.pdf_cedula) throw new Error('La cédula escaneada es obligatoria');

      const formDataToSend = new FormData();
      formDataToSend.append('nombres', formData.nombres);
      formDataToSend.append('apellidos', formData.apellidos);
      formDataToSend.append('tipo_documento', formData.tipo_documento);
      formDataToSend.append('numero_documento', formData.numero_documento);
      formDataToSend.append('caracterizacion', formData.caracterizacion);
      formDataToSend.append('telefono', formData.telefono);
      formDataToSend.append('correo', formData.correo);
      formDataToSend.append('pdf_cedula', formData.pdf_cedula);

      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await api.post(`/inscripciones/oferta/${codigo}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('✅ ¡Inscripción exitosa!');
      console.log('Respuesta:', response.data);
      
      setFormData({
        nombres: '',
        apellidos: '',
        tipo_documento: '',
        numero_documento: '',
        caracterizacion: '',
        telefono: '',
        correo: '',
        pdf_cedula: null
      });

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

  if (loadingDatos) {
    return <div style={styles.loading}>Cargando información de la oferta...</div>;
  }

  if (!oferta) {
    return (
      <div style={styles.container}>
        <div style={styles.errorAlert}>
          ❌ Link de inscripción no válido o expirado
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>📝 Formulario de Inscripción</h2>
      
      {/* Información de la oferta */}
      <div style={styles.ofertaInfo}>
        <h3 style={styles.subtitle}>Información de la Oferta</h3>
        <p><strong>Programa:</strong> {oferta.programa_formacion?.nombre_programa}</p>
        <p><strong>Código:</strong> {oferta.programa_formacion?.codigo}</p>
        <p><strong>Cupos disponibles:</strong> {oferta.cupos_disponibles}</p>
        <p><strong>Fechas:</strong> {new Date(oferta.fechas?.inicio).toLocaleDateString()} - {new Date(oferta.fechas?.fin).toLocaleDateString()}</p>
        <p><strong>Ubicación:</strong> {oferta.ubicacion?.municipio?.nombre}</p>
        
        {/* Botón para descargar PDF - AHORA FUNCIONA */}
        
      </div>

      {error && <div style={styles.errorAlert}>❌ {error}</div>}
      {success && <div style={styles.successAlert}>{success}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        
        <div style={styles.row}>
          <div style={styles.half}>
            <label style={styles.label}>Nombres:</label>
            <input
              type="text"
              name="nombres"
              value={formData.nombres}
              onChange={handleChange}
              style={styles.input}
              placeholder="Ej: Juan Carlos"
              required
            />
          </div>
          <div style={styles.half}>
            <label style={styles.label}>Apellidos:</label>
            <input
              type="text"
              name="apellidos"
              value={formData.apellidos}
              onChange={handleChange}
              style={styles.input}
              placeholder="Ej: Pérez González"
              required
            />
          </div>
        </div>

        <div style={styles.row}>
          <div style={styles.half}>
            <label style={styles.label}>Tipo de Documento:</label>
            <select
              name="tipo_documento"
              value={formData.tipo_documento}
              onChange={handleChange}
              style={styles.select}
              required
            >
              <option value="">Seleccione...</option>
              {tiposDocumento.map(tipo => (
                <option key={tipo._id} value={tipo._id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>
          <div style={styles.half}>
            <label style={styles.label}>Número de Documento:</label>
            <input
              type="text"
              name="numero_documento"
              value={formData.numero_documento}
              onChange={handleChange}
              style={styles.input}
              placeholder="Ej: 123456789"
              required
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Caracterización:</label>
          <select
            name="caracterizacion"
            value={formData.caracterizacion}
            onChange={handleChange}
            style={styles.select}
            required
          >
            <option value="">Seleccione...</option>
            {caracterizaciones.map(car => (
              <option key={car._id} value={car._id}>
                {car.tipo_caracterizacion}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.row}>
          <div style={styles.half}>
            <label style={styles.label}>Teléfono:</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              style={styles.input}
              placeholder="Ej: 3001234567"
              required
            />
          </div>
          <div style={styles.half}>
            <label style={styles.label}>Correo Electrónico:</label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              style={styles.input}
              placeholder="Ej: correo@ejemplo.com"
              required
            />
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Cédula escaneada (PDF):</label>
          <input
            type="file"
            name="pdf_cedula"
            onChange={handleFileChange}
            style={styles.fileInput}
            accept=".pdf"
            required
          />
          <small style={styles.fileHint}>Solo archivos PDF</small>
        </div>

        <button 
          type="submit" 
          style={loading ? {...styles.submitButton, ...styles.buttonDisabled} : styles.submitButton}
          disabled={loading}
        >
          {loading ? 'Procesando inscripción...' : 'Inscribirme'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '40px auto',
    padding: '30px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    fontFamily: 'Arial, sans-serif'
  },
  title: {
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: '30px',
    borderBottom: '2px solid #3498db',
    paddingBottom: '10px'
  },
  ofertaInfo: {
    backgroundColor: '#f8f9fa',
    padding: '15px',
    borderRadius: '6px',
    marginBottom: '25px',
    border: '1px solid #e0e0e0'
  },
  subtitle: {
    color: '#2c3e50',
    marginTop: 0,
    marginBottom: '10px',
    fontSize: '16px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  row: {
    display: 'flex',
    gap: '20px'
  },
  half: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#34495e'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    outline: 'none'
  },
  select: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'white'
  },
  fileInput: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: 'white'
  },
  fileHint: {
    fontSize: '12px',
    color: '#7f8c8d',
    marginTop: '5px'
  },
  submitButton: {
    backgroundColor: '#27ae60',
    color: 'white',
    padding: '15px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  },
  buttonDisabled: {
    backgroundColor: '#95a5a6',
    cursor: 'not-allowed'
  },
  errorAlert: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  successAlert: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '15px',
    borderRadius: '4px',
    marginBottom: '20px'
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '18px',
    color: '#7f8c8d'
  }
};

export default FormularioInscripcion;