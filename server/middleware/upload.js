const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) {
      return cb(new Error('Dozwolone są tylko pliki JPG, PNG lub WEBP.'));
    }
    cb(null, true);
  },
});

module.exports = { upload };
