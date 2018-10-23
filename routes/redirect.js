'use strict';

var express = require('express');
var app = require('../app');

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

router.get('/recipes', function route_logout(req, res) {
	res.redirect('/recipe/browse');
});

module.exports = router;