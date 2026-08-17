const path = require('path');
const fs = require('fs/promises');
const sharp = require('sharp');
const { slugify } = require('./slugify');

const ROOT = path.join(__dirname, '..', '..');
const PICTURES = path.join(ROOT, 'pictures');
const THUMBS_DIR = path.join(PICTURES, 'thumbs');
const LARGE_DIR = path.join(PICTURES, 'large');

// te same parametry co ręczny pipeline ImageMagick opisany w README
const THUMB = { size: 1000, quality: 82 };
const LARGE = { size: 2000, quality: 86 };

async function ensureDirs() {
  await fs.mkdir(THUMBS_DIR, { recursive: true });
  await fs.mkdir(LARGE_DIR, { recursive: true });
}

function uniqueFilename(originalName) {
  const base = path.basename(originalName, path.extname(originalName));
  const slug = slugify(base) || 'zdjecie';
  return `${slug}-${Date.now().toString(36)}.jpg`;
}

// generuje warianty thumbs/ (1000px) i large/ (2000px) z bufora obrazu, zwraca wymiary miniatury
async function generateVariants(buffer, filename) {
  await ensureDirs();

  const thumbBuffer = await sharp(buffer)
    .rotate()
    .resize({ width: THUMB.size, height: THUMB.size, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: THUMB.quality, progressive: true })
    .toBuffer();
  const { width, height } = await sharp(thumbBuffer).metadata();
  await fs.writeFile(path.join(THUMBS_DIR, filename), thumbBuffer);

  await sharp(buffer)
    .rotate()
    .resize({ width: LARGE.size, height: LARGE.size, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: LARGE.quality, progressive: true })
    .toFile(path.join(LARGE_DIR, filename));

  return { width, height };
}

async function deleteVariants(filename) {
  if (!filename) return;
  await Promise.all([
    fs.unlink(path.join(THUMBS_DIR, filename)).catch(() => {}),
    fs.unlink(path.join(LARGE_DIR, filename)).catch(() => {}),
  ]);
}

module.exports = { generateVariants, deleteVariants, uniqueFilename };
