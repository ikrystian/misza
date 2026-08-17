const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const controller = require('../controllers/newsController');

const router = express.Router();
router.use(requireAuth);

router.get('/', controller.list);
router.get('/:slug', controller.get);
router.post('/', upload.single('image'), controller.create);
router.put('/:slug', upload.single('image'), controller.update);
router.delete('/:slug', controller.remove);

module.exports = router;
