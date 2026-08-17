const dataStore = require('../services/dataStore');

const SECTIONS = ['hero', 'about', 'showcase', 'services', 'cta', 'instagram', 'footer'];

async function getAll(req, res) {
  res.json(await dataStore.readJSON('site-content'));
}

async function updateSection(req, res) {
  const { section } = req.params;
  if (!SECTIONS.includes(section)) {
    return res.status(400).json({ error: `Nieznana sekcja. Dozwolone: ${SECTIONS.join(', ')}.` });
  }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Nieprawidłowe dane sekcji.' });
  }

  const content = await dataStore.update('site-content', (content) => {
    content[section] = req.body;
    return content;
  });

  res.json(content[section]);
}

module.exports = { getAll, updateSection, SECTIONS };
