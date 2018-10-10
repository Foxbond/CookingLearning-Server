var express = require('express');

var router = express.Router({
	caseSensitive: app.get('case sensitive routing'),
	strict: app.get('strict routing')
});

/* GET home page. */
router.get('/', function(req, res) {
	res.render('index', { title: 'Express' });
});

module.exports = router;
