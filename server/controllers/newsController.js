const dataStore = require('../services/dataStore');
const imageService = require('../services/imageService');
const { slugify } = require('../services/slugify');

function parseContent(raw) {
  if (raw === undefined) return undefined;
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('not an array');
    return parsed.filter((b) => b && typeof b.text === 'string' && ['p', 'quote'].includes(b.type));
  } catch {
    throw Object.assign(new Error('Nieprawidłowy format treści.'), { status: 400 });
  }
}

async function list(req, res) {
  const news = await dataStore.readJSON('news');
  news.sort((a, b) => (a.date < b.date ? 1 : -1));
  res.json(news);
}

async function get(req, res) {
  const news = await dataStore.readJSON('news');
  const post = news.find((n) => n.slug === req.params.slug);
  if (!post) return res.status(404).json({ error: 'Nie znaleziono wpisu.' });
  res.json(post);
}

async function create(req, res) {
  const { title, category, date, excerpt, readTime, imageAlt, status } = req.body;
  if (!title || !category || !date || !excerpt) {
    return res.status(400).json({ error: 'Tytuł, kategoria, data i zajawka są wymagane.' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'Zdjęcie jest wymagane.' });
  }

  let content;
  try {
    content = parseContent(req.body.content) || [];
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  const filename = imageService.uniqueFilename(req.file.originalname);
  await imageService.generateVariants(req.file.buffer, filename);

  const postStatus = status === 'draft' ? 'draft' : 'published';

  let created = null;
  await dataStore.update('news', (news) => {
    const base = slugify(title) || 'wpis';
    let slug = base;
    let n = 2;
    while (news.some((p) => p.slug === slug)) slug = `${base}-${n++}`;

    created = {
      slug,
      status: postStatus,
      category,
      date,
      title,
      excerpt,
      readTime: readTime || '3 min',
      image: filename,
      imageAlt: imageAlt || title,
      content,
    };
    news.push(created);
    return news;
  });

  res.status(201).json(created);
}

async function update(req, res) {
  const { slug } = req.params;
  const { title, category, date, excerpt, readTime, imageAlt, status } = req.body;

  let content;
  try {
    content = parseContent(req.body.content);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  const news = await dataStore.readJSON('news');
  const existing = news.find((p) => p.slug === slug);
  if (!existing) return res.status(404).json({ error: 'Nie znaleziono wpisu.' });

  const oldImage = existing.file || existing.image;
  let newFilename = null;
  if (req.file) {
    newFilename = imageService.uniqueFilename(req.file.originalname);
    await imageService.generateVariants(req.file.buffer, newFilename);
  }

  let updated = null;
  await dataStore.update('news', (news) => {
    const entry = news.find((p) => p.slug === slug);
    if (!entry) return news;
    if (status !== undefined) {
      entry.status = status === 'draft' ? 'draft' : 'published';
    }
    if (title !== undefined) entry.title = title;
    if (category !== undefined) entry.category = category;
    if (date !== undefined) entry.date = date;
    if (excerpt !== undefined) entry.excerpt = excerpt;
    if (readTime !== undefined) entry.readTime = readTime;
    if (imageAlt !== undefined) entry.imageAlt = imageAlt;
    if (content !== undefined) entry.content = content;
    if (newFilename) entry.image = newFilename;
    updated = entry;
    return news;
  });

  if (newFilename) await imageService.deleteVariants(oldImage);
  res.json(updated);
}

async function remove(req, res) {
  const { slug } = req.params;
  let removed = null;

  await dataStore.update('news', (news) => {
    const idx = news.findIndex((p) => p.slug === slug);
    if (idx === -1) return news;
    removed = news[idx];
    news.splice(idx, 1);
    return news;
  });

  if (!removed) return res.status(404).json({ error: 'Nie znaleziono wpisu.' });
  await imageService.deleteVariants(removed.image);
  res.json({ success: true });
}

module.exports = { list, get, create, update, remove };
