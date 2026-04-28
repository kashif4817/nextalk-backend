import multer from 'multer';

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpeg, png, gif, webp) are allowed'), false);
  }
};

const audioFilter = (req, file, cb) => {
  const allowed = ['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/wav'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed'), false);
  }
};

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: imageFilter,
}).single('file');

// Handles documents and videos — 25 MB ceiling covers both
export const uploadFile = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
}).single('file');

export const uploadAudio = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: audioFilter,
}).single('file');
