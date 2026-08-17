const express = require('express');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/contentController');

const router = express.Router();
router.use(requireAuth);

router.get('/', controller.getAll);
router.put('/:section', controller.updateSection);

module.exports = router;
