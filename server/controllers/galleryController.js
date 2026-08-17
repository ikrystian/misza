const crypto = require('crypto');
const dataStore = require('../services/dataStore');
const imageService = require('../services/imageService');

async function list(req, res) {
  const gallery = await dataStore.readJSON('gallery');
  gallery.sort((a, b) => a.order - b.order);
  res.json(gallery);
}

async function create(req, res) {
  const { title, alt, category } = req.body;
  if (!title || !category) {
    return res.status(400).json({ error: 'Tytuł i kategoria są wymagane.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Zdjęcie jest wymagane.' });
  }

  const categories = await dataStore.readJSON('categories');
  if (!categories.some((c) => c.slug === category)) {
    return res.status(400).json({ error: 'Nieznana kategoria.' });
  }

  const filename = imageService.uniqueFilename(req.file.originalname);
  const { width, height } = await imageService.generateVariants(req.file.buffer, filename);

  let created = null;
  await dataStore.update('gallery', (gallery) => {
    const nextOrder = gallery.reduce((max, g) => Math.max(max, g.order), 0) + 1;
    created = {
      id: crypto.randomUUID(),
      category,
      title,
      alt: alt || title,
      file: filename,
      width,
      height,
      order: nextOrder,
    };
    gallery.push(created);
    return gallery;
  });

  res.status(201).json(created);
}

async function update(req, res) {
  const { id } = req.params;
  const { title, alt, category } = req.body;

  if (category) {
    const categories = await dataStore.readJSON('categories');
    if (!categories.some((c) => c.slug === category)) {
      return res.status(400).json({ error: 'Nieznana kategoria.' });
    }
  }

  let updated = null;
  const gallery = await dataStore.update('gallery', (gallery) => {
    const item = gallery.find((g) => g.id === id);
    if (!item) return gallery;
    if (title !== undefined) item.title = title;
    if (alt !== undefined) item.alt = alt;
    if (category !== undefined) item.category = category;
    updated = item;
    return gallery;
  });

  if (!updated) return res.status(404).json({ error: 'Nie znaleziono zdjęcia.' });
  res.json(updated);
}

async function updateImage(req, res) {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: 'Zdjęcie jest wymagane.' });

  const gallery = await dataStore.readJSON('gallery');
  const item = gallery.find((g) => g.id === id);
  if (!item) return res.status(404).json({ error: 'Nie znaleziono zdjęcia.' });

  const oldFile = item.file;
  const filename = imageService.uniqueFilename(req.file.originalname);
  const { width, height } = await imageService.generateVariants(req.file.buffer, filename);

  let updated = null;
  await dataStore.update('gallery', (gallery) => {
    const entry = gallery.find((g) => g.id === id);
    if (!entry) return gallery;
    entry.file = filename;
    entry.width = width;
    entry.height = height;
    updated = entry;
    return gallery;
  });

  await imageService.deleteVariants(oldFile);
  res.json(updated);
}

async function remove(req, res) {
  const { id } = req.params;
  let removed = null;

  await dataStore.update('gallery', (gallery) => {
    const idx = gallery.findIndex((g) => g.id === id);
    if (idx === -1) return gallery;
    removed = gallery[idx];
    gallery.splice(idx, 1);
    gallery.forEach((g, i) => { g.order = i + 1; });
    return gallery;
  });

  if (!removed) return res.status(404).json({ error: 'Nie znaleziono zdjęcia.' });
  await imageService.deleteVariants(removed.file);
  res.json({ success: true });
}

async function reorder(req, res) {
  const { order } = req.body;
  if (!Array.isArray(order)) {
    return res.status(400).json({ error: 'Wymagana jest tablica `order` z identyfikatorami zdjęć.' });
  }

  const gallery = await dataStore.update('gallery', (gallery) => {
    const byId = new Map(gallery.map((g) => [g.id, g]));
    order.forEach((id, i) => {
      const item = byId.get(id);
      if (item) item.order = i + 1;
    });
    return gallery;
  });

  gallery.sort((a, b) => a.order - b.order);
  res.json(gallery);
}

module.exports = { list, create, update, updateImage, remove, reorder };
