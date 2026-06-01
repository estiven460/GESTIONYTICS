// src/utils/dateUtils.js

/**
 * Convierte cualquier entrada (string ISO, Date, o YYYY-MM-DD) a un objeto Date local.
 */
export const parseLocalDate = (fechaInput) => {
  if (!fechaInput) return null;
  
  let fechaStr;
  if (fechaInput instanceof Date) {
    fechaStr = fechaInput;
  } else if (typeof fechaInput === 'string') {
    // Si es ISO (contiene T), extraer solo la parte de fecha
    if (fechaInput.includes('T')) {
      fechaStr = fechaInput.split('T')[0];
    } else {
      fechaStr = fechaInput;
    }
    const [year, month, day] = fechaStr.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month - 1, day);
  }
  return fechaStr instanceof Date ? fechaStr : null;
};

/**
 * Formatea cualquier fecha (ISO string, Date, YYYY-MM-DD) a DD/MM/YYYY local.
 */
export const formatLocalDate = (fechaInput) => {
  if (!fechaInput) return 'N/A';
  
  let year, month, day;
  
  if (fechaInput instanceof Date) {
    year = fechaInput.getFullYear();
    month = fechaInput.getMonth() + 1;
    day = fechaInput.getDate();
  } else if (typeof fechaInput === 'string') {
    let fechaStr = fechaInput;
    if (fechaStr.includes('T')) {
      fechaStr = fechaStr.split('T')[0];
    }
    const parts = fechaStr.split('-');
    if (parts.length !== 3) return 'N/A';
    [year, month, day] = parts.map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return 'N/A';
  } else {
    return 'N/A';
  }
  
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('es-CO');
};

/**
 * Para fechas que vienen como ISO con hora (ej. "2026-06-01T00:00:00.000Z")
 */
export const formatISODateToLocal = (isoString) => {
  if (!isoString) return 'N/A';
  const datePart = isoString.split('T')[0];
  return formatLocalDate(datePart);
};