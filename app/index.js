const express = require('express');
const router = express.Router();
const openaiController = require('../controllers/openai');

router.use('/categories', require('./categories'));
router.use('/images', require('./images'));

router.post('/textToImage', openaiController.generateImage);
router.post('/textToimageNew', openaiController.generateImageByChatCompletions);
router.get('/textToImage/tasks/:taskId', openaiController.getUploadTaskStatus);

module.exports = router;
