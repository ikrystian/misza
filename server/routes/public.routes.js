const express = require('express');
const controller = require('../controllers/publicController');

const router = express.Router();

router.get('/', controller.home);
router.get('/gallery.html', controller.gallery);
router.get('/aktualnosci.html', controller.aktualnosci);
router.get('/post.html', controller.post);

module.exports = router;
