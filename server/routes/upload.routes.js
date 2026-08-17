const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const controller = require('../controllers/uploadController');

const router = express.Router();
router.use(requireAuth);

router.post('/', upload.single('image'), controller.uploadImage);

module.exports = router;
