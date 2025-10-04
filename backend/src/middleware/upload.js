//backend/src/middleware/upload.js
const multer = require('multer');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'audio/midi' || file.mimetype === 'audio/mid' || 
      file.originalname.match(/\.(mid|midi)$/)) {
    cb(null, true);
  } else {
    cb(new Error('Only MIDI files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = upload;
