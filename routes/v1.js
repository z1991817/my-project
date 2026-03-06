const express = require('express');
const router = express.Router();

router.use('/admin', require('./admin'));
router.use('/openai', require('./openai'));
router.use('/', require('./users'));

module.exports = router;
