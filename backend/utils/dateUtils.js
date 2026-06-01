// backend/utils/dateUtils.js

/**
 * Convierte una fecha en string (YYYY-MM-DD o ISO) a un objeto Date en hora local (00:00:00)
 */
const parseLocalDate = (fechaInput) => {
  if (!fechaInput) return null;
  if (fechaInput instanceof Date) return fechaInput;
  
  let str = fechaInput;
  if (str.includes('T')) str = str.split('T')[0];
  const [year, month, day] = str.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day);
};

/**
 * Formatea una fecha (string YYYY-MM-DD, ISO o Date) a DD/MM/YYYY en hora local
 */
const formatLocalDate = (fechaInput) => {
  if (!fechaInput) return '';
  
  let year, month, day;
  
  if (fechaInput instanceof Date) {
    year = fechaInput.getFullYear();
    month = fechaInput.getMonth() + 1;
    day = fechaInput.getDate();
  } else if (typeof fechaInput === 'string') {
    let str = fechaInput;
    if (str.includes('T')) str = str.split('T')[0];
    const parts = str.split('-');
    if (parts.length !== 3) return '';
    [year, month, day] = parts.map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return '';
  } else {
    return '';
  }
  
  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
};

module.exports = { parseLocalDate, formatLocalDate };