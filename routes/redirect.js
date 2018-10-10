var express = require('express');

var router = express.Router({
	caseSensitive: app.get('case sensitive routing'),
	strict: app.get('strict routing')
});

router.get('/login', function route_login(req, res) {
	res.redirect('/user/login');
});

router.get('/logout', function route_logout(req, res) {
	res.redirect('/user/logout');
});

module.exports = router;
