const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { upload } = require('../middleware/cosUpload');

// 获取图片列表
router.get('/', imageController.list);

// 上传图片到临时目录
router.post('/upload', upload.single('file'), imageController.uploadToTemp);

module.exports = router;
