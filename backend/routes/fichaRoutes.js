// backend/routes/fichaRoutes.js
const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { protect } = require('../middlewares/authMiddleware');
const {
  iniciarProcesoFicha,
  generarExcelMasivoAspirantes,
  subirExcelMasivo,
  descargarExcelParaValidar,
  subirExcelValidado,
  descargarExcelValidado,
  confirmarMatriculaCompletada,
  getResumenProcesoFicha,
  matricularDirectamente  // ← IMPORTAR AQUÍ TAMBIÉN
} = require('../controllers/fichaController');

// Rutas
router.post('/:ofertaId/iniciar-proceso', protect, iniciarProcesoFicha);
router.get('/:ofertaId/generar-excel', protect, generarExcelMasivoAspirantes);
router.post('/:ofertaId/subir-excel', protect, upload.single('excel'), subirExcelMasivo);
router.get('/:ofertaId/descargar-excel-validado', protect, descargarExcelValidado);
router.post('/:ofertaId/confirmar-matricula', protect, confirmarMatriculaCompletada);
router.get('/:ofertaId/descargar-para-validar', protect, descargarExcelParaValidar);
router.post('/:ofertaId/subir-validado', protect, upload.single('excel'), subirExcelValidado);
router.get('/:ofertaId/resumen', protect, getResumenProcesoFicha);
router.post('/:ofertaId/matricular-directo', protect, matricularDirectamente);  // ← AGREGAR ESTA LÍNEA

module.exports = router;