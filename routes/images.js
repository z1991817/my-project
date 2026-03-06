const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const { upload } = require('../middleware/cosUpload');

// 获取图片列表
router.get('/', imageController.list);

// 获取图片详情
router.get('/:id', imageController.detail);

// 上传图片文件
router.post('/upload', upload.single('file'), imageController.upload);

// 上传图片（通过URL）
router.post('/create', imageController.create);

// 更新图片
router.put('/:id', imageController.update);

// 删除图片
router.delete('/:id', imageController.delete);

module.exports = router;
