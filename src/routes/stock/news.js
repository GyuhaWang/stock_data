const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
	const news = req.news;

	if (news) {
		res.json(news);
	} else {
		res.status(404).json({ error: '데이터가 아직 준비되지 않았습니다.' });
	}
});

module.exports = router;
