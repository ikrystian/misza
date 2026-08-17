const express = require('express');
const authController = require('../controllers/authController');
const adminPages = require('../controllers/adminPagesController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/login', authController.loginPage);

router.use(requireAuth);

router.get('/', adminPages.dashboard);

router.get('/gallery', adminPages.galleryPage);
router.get('/gallery/new', adminPages.galleryFormNew);
router.get('/gallery/:id/edit', adminPages.galleryFormEdit);

router.get('/news', adminPages.newsPage);
router.get('/news/new', adminPages.newsFormNew);
router.get('/news/:slug/edit', adminPages.newsFormEdit);

router.get('/content', adminPages.contentPage);

module.exports = router;
