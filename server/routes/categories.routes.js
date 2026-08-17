const express = require('express');
const { requireAuth } = require('../middleware/auth');
const controller = require('../controllers/categoriesController');

const router = express.Router();
router.use(requireAuth);

router.get('/', controller.list);
router.post('/', controller.create);
router.put('/:slug', controller.update);
router.delete('/:slug', controller.remove);

module.exports = router;
