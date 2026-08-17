const path = require('path');
const express = require('express');
const session = require('express-session');
const env = require('./config/env');
const { requireAuth } = require('./middleware/auth');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const publicRoutes = require('./routes/public.routes');
const galleryRoutes = require('./routes/gallery.routes');
const categoriesRoutes = require('./routes/categories.routes');
const newsRoutes = require('./routes/news.routes');
const contentRoutes = require('./routes/content.routes');
const uploadRoutes = require('./routes/upload.routes');

const ROOT = path.join(__dirname, '..');

const app = express();

app.set('views', path.join(ROOT, 'views'));
app.set('view engine', 'ejs');
app.set('trust proxy', 1);

// helpery dostępne we wszystkich widokach EJS
const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

app.locals.pic = (file, variant) => `/pictures/${variant}/${file}`;
// treść pochodzi z panelu (dane admina), ale i tak escapujemy przed wstrzyknięciem &nbsp;/<br> —
// to pola tekstowe, nie miejsce na HTML
app.locals.eyebrowHtml = (str) => escapeHtml(str).replace(/\s*\/\/\s*/g, ' &nbsp;//&nbsp; ');
app.locals.multilineHtml = (str) => escapeHtml(str).split('\n').join('<br>');
app.locals.dateLabelPl = (isoDate) => new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(isoDate));
app.locals.pad2 = (n) => String(n).padStart(2, '0');
// bezpieczne osadzanie JSON w <script> — bez tego "</script>" w treści (np. tytule) zamknąłby tag przedwcześnie
app.locals.jsonScript = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  name: 'misza.sid',
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProduction,
    maxAge: 1000 * 60 * 60 * 12,
  },
}));

// prosta ochrona CSRF na mutujących trasach API: żądanie musi pochodzić z tego samego originu
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const origin = req.get('origin') || req.get('referer');
    if (origin && !origin.startsWith(`${req.protocol}://${req.get('host')}`)) {
      return res.status(403).json({ error: 'Nieprawidłowe źródło żądania.' });
    }
  }
  next();
});

app.use('/css', express.static(path.join(ROOT, 'css')));
app.use('/js', express.static(path.join(ROOT, 'js')));
app.use('/pictures', express.static(path.join(ROOT, 'pictures')));
app.use('/public', express.static(path.join(ROOT, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/admin', adminRoutes);
app.use('/', publicRoutes);

app.use((req, res) => {
  res.status(404).send('Nie znaleziono strony.');
});

app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const isUpload = err.name === 'MulterError' || /^Dozwolone są tylko/.test(err.message || '');
  const status = err.status || (isUpload ? 400 : 500);
  if (status >= 500) console.error(err);

  if (req.originalUrl.startsWith('/api/')) {
    return res.status(status).json({ error: isUpload ? err.message : (status < 500 ? err.message : 'Błąd serwera.') });
  }
  res.status(status).send(status < 500 ? err.message : 'Błąd serwera.');
});

module.exports = app;
