'use strict';

const express = require('express');
const app = require('../app');

const router = express.Router({
	caseSensitive: app.get('case sensitive routing'),
	strict: app.get('strict routing')
});

/* GET home page. */
router.get('/', function route_root(req, res) {
	res.render('index', { title: 'Express' });
});

module.exports = router;