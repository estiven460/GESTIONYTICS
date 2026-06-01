import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { formatLocalDate } from '../utils/dateUtils';

const OfertasRechazadas = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarRechazadas();
  }, []);

  const cargarRechazadas = async () => {
    try {
      const response = await api.get('/solicitudes/mis-rechazadas');
      setSolicitudes(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>❌ Ofertas Rechazadas</h2>
      {solicitudes.map(sol => (
        <div key={sol._id} style={styles.card}>
          <h3>{sol.oferta_id?.programa_formacion?.nombre_programa}</h3>
          <p><strong>Motivo del rechazo:</strong> {sol.comentarios}</p>
          <p><strong>Fecha:</strong> {formatLocalDate(sol.fecha_respuesta?.split('T')[0])}</p>
          <button style={styles.boton}>Corregir y reenviar</button>
        </div>
      ))}
    </div>
  );
};