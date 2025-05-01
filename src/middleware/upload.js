const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage based on environment
const getStorage = () => {
  // For Vercel serverless environment, use memory storage 
  // with /tmp directory for temporary file storage
  if (process.env.NODE_ENV === 'production') {
    const tmpDir = path.join('/tmp', 'uploads');
    
    // Ensure the directory exists
    if (!fs.existsSync(tmpDir)) {
      try {
        fs.mkdirSync(tmpDir, { recursive: true });
      } catch (err) {
        console.error('Failed to create tmp uploads directory:', err);
      }
    }
    
    return multer.diskStorage({
      destination: function(req, file, cb) {
        cb(null, tmpDir);
      },
      filename: function(req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
      }
    });
  } 
  
  // For development environment, use regular disk storage
  return multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, './uploads/');
    },
    filename: function(req, file, cb) {
      cb(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
    }
  });
};

// Create multer instance with configured storage
const upload = multer({ storage: getStorage() });

module.exports = upload; 