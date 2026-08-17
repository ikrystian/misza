const dataStore = require('../services/dataStore');
const { slugify } = require('../services/slugify');

async function withCounts() {
  const [categories, gallery] = await Promise.all([
    dataStore.readJSON('categories'),
    dataStore.readJSON('gallery'),
  ]);
  const counts = {};
  gallery.forEach((g) => { counts[g.category] = (counts[g.category] || 0) + 1; });
  return categories
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ ...c, count: counts[c.slug] || 0 }));
}

async function list(req, res) {
  res.json(await withCounts());
}

async function create(req, res) {
  const { label } = req.body;
  if (!label || !label.trim()) {
    return res.status(400).json({ error: 'Nazwa kategorii jest wymagana.' });
  }

  let created = null;
  await dataStore.update('categories', (categories) => {
    const base = slugify(label) || 'kategoria';
    let slug = base;
    let n = 2;
    while (categories.some((c) => c.slug === slug)) {
      slug = `${base}-${n++}`;
    }
    const nextOrder = categories.reduce((max, c) => Math.max(max, c.order), 0) + 1;
    created = { slug, label: label.trim(), order: nextOrder };
    categories.push(created);
    return categories;
  });

  res.status(201).json(created);
}

async function update(req, res) {
  const { slug } = req.params;
  const { label } = req.body;
  if (!label || !label.trim()) {
    return res.status(400).json({ error: 'Nazwa kategorii jest wymagana.' });
  }

  let updated = null;
  await dataStore.update('categories', (categories) => {
    const item = categories.find((c) => c.slug === slug);
    if (!item) return categories;
    item.label = label.trim();
    updated = item;
    return categories;
  });

  if (!updated) return res.status(404).json({ error: 'Nie znaleziono kategorii.' });
  res.json(updated);
}

async function remove(req, res) {
  const { slug } = req.params;
  const gallery = await dataStore.readJSON('gallery');
  const count = gallery.filter((g) => g.category === slug).length;
  if (count > 0) {
    return res.status(409).json({ error: `Nie można usunąć kategorii — zawiera ${count} zdjęć.` });
  }

  let removed = false;
  await dataStore.update('categories', (categories) => {
    const idx = categories.findIndex((c) => c.slug === slug);
    if (idx === -1) return categories;
    categories.splice(idx, 1);
    removed = true;
    return categories;
  });

  if (!removed) return res.status(404).json({ error: 'Nie znaleziono kategorii.' });
  res.json({ success: true });
}

module.exports = { list, create, update, remove };
