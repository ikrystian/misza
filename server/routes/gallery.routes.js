const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const controller = require('../controllers/galleryController');

const router = express.Router();
router.use(requireAuth);

router.get('/', controller.list);
router.post('/', upload.single('image'), controller.create);
router.put('/reorder', controller.reorder);
router.put('/:id/image', upload.single('image'), controller.updateImage);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
