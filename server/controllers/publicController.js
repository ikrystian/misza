const dataStore = require('../services/dataStore');

const AKTUALNOSCI_CTA_IMAGE = '97605673_608548533117445_2836186498636709888_n.jpg';
const POST_CTA_IMAGE = '61163821_389454365026864_6372790439929446400_n.jpg';

function sortByDateDesc(news) {
  return news.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
}

async function home(req, res) {
  const [content, news] = await Promise.all([
    dataStore.readJSON('site-content'),
    dataStore.readJSON('news'),
  ]);
  const latestNews = sortByDateDesc(news).slice(0, 3);
  res.render('index', { content, latestNews });
}

async function gallery(req, res) {
  const [content, galleryItems, categories] = await Promise.all([
    dataStore.readJSON('site-content'),
    dataStore.readJSON('gallery'),
    dataStore.readJSON('categories'),
  ]);
  galleryItems.sort((a, b) => a.order - b.order);
  categories.sort((a, b) => a.order - b.order);

  const counts = {};
  galleryItems.forEach((g) => { counts[g.category] = (counts[g.category] || 0) + 1; });
  const categoriesWithCounts = categories.map((c) => ({ ...c, count: counts[c.slug] || 0 }));

  const labelBySlug = new Map(categories.map((c) => [c.slug, c.label]));
  const categoryLabel = (slug) => labelBySlug.get(slug) || slug;

  res.render('gallery', {
    content,
    gallery: galleryItems,
    categories: categoriesWithCounts,
    categoryLabel,
  });
}

async function aktualnosci(req, res) {
  const [content, news] = await Promise.all([
    dataStore.readJSON('site-content'),
    dataStore.readJSON('news'),
  ]);
  const sorted = sortByDateDesc(news);
  const [featured, ...rest] = sorted;
  res.render('aktualnosci', {
    content,
    featured: featured || null,
    rest,
    ctaImage: AKTUALNOSCI_CTA_IMAGE,
  });
}

async function post(req, res) {
  const [content, news] = await Promise.all([
    dataStore.readJSON('site-content'),
    dataStore.readJSON('news'),
  ]);
  const sorted = sortByDateDesc(news);
  const slug = req.query.slug;
  const index = sorted.findIndex((p) => p.slug === slug);
  const found = index !== -1 ? sorted[index] : null;

  if (!found) {
    res.status(404);
    return res.render('post', {
      content,
      post: null,
      prevPost: null,
      nextPost: null,
      related: [],
      hasMultiplePosts: false,
      shareUrl: '',
      ctaImage: POST_CTA_IMAGE,
    });
  }

  const prevPost = sorted[(index - 1 + sorted.length) % sorted.length];
  const nextPost = sorted[(index + 1) % sorted.length];
  const others = sorted.filter((p) => p.slug !== found.slug);
  const sameCategory = others.filter((p) => p.category === found.category);
  const rest = others.filter((p) => p.category !== found.category);
  const related = [...sameCategory, ...rest].slice(0, 3);

  res.render('post', {
    content,
    post: found,
    prevPost,
    nextPost,
    related,
    hasMultiplePosts: sorted.length > 1,
    shareUrl: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    ctaImage: POST_CTA_IMAGE,
  });
}

module.exports = { home, gallery, aktualnosci, post };
