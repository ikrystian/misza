const bcrypt = require('bcryptjs');
const env = require('../config/env');

function loginPage(req, res) {
  if (req.session?.isAdmin) return res.redirect('/admin');
  res.render('admin/login', { error: null });
}

async function login(req, res) {
  const { username, password } = req.body || {};
  const validUsername = typeof username === 'string' && username === env.adminUsername;
  const validPassword = validUsername && (await bcrypt.compare(String(password || ''), env.adminPasswordHash));

  if (!validUsername || !validPassword) {
    return res.status(401).json({ error: 'Nieprawidłowy login lub hasło.' });
  }

  req.session.isAdmin = true;
  req.session.username = username;
  res.json({ success: true });
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('misza.sid');
    res.json({ success: true });
  });
}

function session(req, res) {
  res.json({
    authenticated: Boolean(req.session?.isAdmin),
    username: req.session?.username || null,
  });
}

module.exports = { loginPage, login, logout, session };
