var express = require('express');
var router = express.Router();

router.get('/login', function (req, res) {
	res.redirect('/user/login');
});

router.get('/logout', function (req, res) {
	res.redirect('/user/logout');
});

module.exports = router;
