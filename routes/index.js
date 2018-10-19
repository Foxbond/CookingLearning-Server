'use strict';

var express = require('express');
var app = require('../app');

var router = express.Router({
	caseSensitive: app.get('case sensitive routing'),
	strict: app.get('strict routing')
});

/* GET home page. */
router.get('/', function route_root(req, res) {
	res.render('index', { title: 'Express' });
});

module.exports = router;