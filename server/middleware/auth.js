function requireAuth(req, res, next) {
  if (req.session?.isAdmin) return next();
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(401).json({ error: 'Wymagane logowanie.' });
  }
  return res.redirect('/admin/login');
}

module.exports = { requireAuth };
