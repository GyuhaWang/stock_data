const express = require('express');
const openCloseRoutes = require('./openclose');
const newsRoutes = require('./news');

const router = express.Router();

router.use('/openclose', openCloseRoutes);
router.use('/news', newsRoutes);

module.exports = router;
