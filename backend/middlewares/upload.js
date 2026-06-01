// backend/middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Asegurar que las carpetas existen
const uploadDirs = [
  path.join(__dirname, '../uploads/documentos'),
  path.join(__dirname, '../uploads/excel'),
  path.join(__dirname, '../uploads/cedulas'),
  path.join(__dirname, '../uploads/fusionados'),
  path.join(__dirname, '../uploads/fichas')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configurar almacenamiento dinámico según el tipo de archivo
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let destDir = path.join(__dirname, '../uploads/documentos');
    
    // Determinar carpeta según el campo del archivo
    if (file.fieldname === 'excel' || file.fieldname === 'excel_validado') {
      destDir = path.join(__dirname, '../uploads/excel');
    } else if (file.fieldname === 'pdf_cedula') {
      destDir = path.join(__dirname, '../uploads/cedulas');
    } else if (file.fieldname === 'firma_digital_pdf' || file.fieldname === 'carta_pdf') {
      destDir = path.join(__dirname, '../uploads/documentos');
    } else if (file.fieldname === 'confirmacion') {
      destDir = path.join(__dirname, '../uploads/confirmaciones');
    }
    
    // Crear directorio si no existe
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    cb(null, destDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// ✅ CORREGIDO: Permitir Excel, PDF, PNG, JPG
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/png', 
    'image/jpeg', 
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel' // .xls
  ];
  
  // También verificar por extensión
  const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos PDF, Excel (XLSX/XLS), PNG o JPG'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo para Excel
  }
});

// Exportar directamente el objeto upload
module.exports = upload;