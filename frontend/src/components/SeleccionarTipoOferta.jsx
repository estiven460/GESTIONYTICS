import React from 'react';

const SeleccionarTipoOferta = ({ onSeleccionar }) => {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>¿Qué tipo de oferta deseas crear?</h2>
      
      <div style={styles.buttonContainer}>
        <button 
          onClick={() => onSeleccionar('regular')}
          style={{...styles.button, ...styles.regularButton}}
        >
          <span style={styles.buttonIcon}>🟢</span>
          <span style={styles.buttonText}>REGULAR</span>
          <span style={styles.buttonDesc}>Formación estándar sin instructores adicionales</span>
        </button>

        <button 
          onClick={() => onSeleccionar('campesena')}
          style={{...styles.button, ...styles.campesenaButton}}
        >
          <span style={styles.buttonIcon}>🟠</span>
          <span style={styles.buttonText}>CAMPESENA</span>
          <span style={styles.buttonDesc}>Incluye 2 instructores adicionales y duración de 5 meses</span>
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '40px 20px',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif'
  },
  title: {
    color: '#2c3e50',
    marginBottom: '40px',
    fontSize: '24px'
  },
  buttonContainer: {
    display: 'flex',
    gap: '30px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  button: {
    flex: '1',
    minWidth: '250px',
    padding: '30px 20px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    transition: 'transform 0.3s, box-shadow 0.3s',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    ':hover': {
      transform: 'translateY(-5px)',
      boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
    }
  },
  regularButton: {
    backgroundColor: '#27ae60',
    color: 'white'
  },
  campesenaButton: {
    backgroundColor: '#e67e22',
    color: 'white'
  },
  buttonIcon: {
    fontSize: '48px'
  },
  buttonText: {
    fontSize: '24px',
    fontWeight: 'bold'
  },
  buttonDesc: {
    fontSize: '14px',
    opacity: 0.9
  }
};

export default SeleccionarTipoOferta;