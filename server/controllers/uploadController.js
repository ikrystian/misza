const imageService = require('../services/imageService');

async function uploadImage(req, res) {
  if (!req.file) return res.status(400).json({ error: 'Zdjęcie jest wymagane.' });

  const filename = imageService.uniqueFilename(req.file.originalname);
  const { width, height } = await imageService.generateVariants(req.file.buffer, filename);

  res.status(201).json({
    file: filename,
    width,
    height,
    thumbUrl: `/pictures/thumbs/${filename}`,
    largeUrl: `/pictures/large/${filename}`,
  });
}

module.exports = { uploadImage };
