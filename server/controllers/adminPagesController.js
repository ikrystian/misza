const dataStore = require('../services/dataStore');

async function dashboard(req, res) {
  const [gallery, categories, news] = await Promise.all([
    dataStore.readJSON('gallery'),
    dataStore.readJSON('categories'),
    dataStore.readJSON('news'),
  ]);
  res.render('admin/dashboard', {
    username: req.session.username,
    stats: { photos: gallery.length, categories: categories.length, posts: news.length },
  });
}

async function galleryPage(req, res) {
  const [gallery, categories] = await Promise.all([
    dataStore.readJSON('gallery'),
    dataStore.readJSON('categories'),
  ]);
  gallery.sort((a, b) => a.order - b.order);
  categories.sort((a, b) => a.order - b.order);
  res.render('admin/gallery', { username: req.session.username, gallery, categories });
}

async function galleryFormNew(req, res) {
  const categories = await dataStore.readJSON('categories');
  categories.sort((a, b) => a.order - b.order);
  res.render('admin/gallery-form', { username: req.session.username, mode: 'create', item: null, categories });
}

async function galleryFormEdit(req, res) {
  const [gallery, categories] = await Promise.all([
    dataStore.readJSON('gallery'),
    dataStore.readJSON('categories'),
  ]);
  const item = gallery.find((g) => g.id === req.params.id);
  if (!item) return res.status(404).send('Nie znaleziono zdjęcia.');
  categories.sort((a, b) => a.order - b.order);
  res.render('admin/gallery-form', { username: req.session.username, mode: 'edit', item, categories });
}

async function newsPage(req, res) {
  const news = await dataStore.readJSON('news');
  news.sort((a, b) => (a.date < b.date ? 1 : -1));
  res.render('admin/news', { username: req.session.username, news });
}

function newsFormNew(req, res) {
  res.render('admin/news-form', { username: req.session.username, mode: 'create', item: null });
}

async function newsFormEdit(req, res) {
  const news = await dataStore.readJSON('news');
  const item = news.find((n) => n.slug === req.params.slug);
  if (!item) return res.status(404).send('Nie znaleziono wpisu.');
  res.render('admin/news-form', { username: req.session.username, mode: 'edit', item });
}

async function contentPage(req, res) {
  const content = await dataStore.readJSON('site-content');
  res.render('admin/content', { username: req.session.username, content });
}

module.exports = {
  dashboard,
  galleryPage,
  galleryFormNew,
  galleryFormEdit,
  newsPage,
  newsFormNew,
  newsFormEdit,
  contentPage,
};
