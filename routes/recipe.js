'use strict';

var express = require('express');
var app = require('../app');
var createError = require('http-errors');

var router = express.Router({
	caseSensitive: app.get('case sensitive routing'),
	strict: app.get('strict routing')
});

router.get('/', function route_root(req, res) {
	res.redirect('/recipe/browse');
});//router.get('/

//TODO: rewrite it to more strict matching
router.get('/show/*', function route_root(req, res) {
	res.redirect('/recipe/' + req.params[0]);
});

router.get('/:recipeId(\\d+)', function route_showShort(req, res, next) {
	var recipeId = parseInt(req.params.recipeId);
	if (recipeId <= 0) {
		return next();
	}

	//TODO: Fetch name and redirect to /recipe/:recipeId/:recipeName
	//res.status(301).location('/recipe/:recipeId/:recipeName');
	res.send('/recipe/:recipeId');
});

router.get('/:recipeId(\\d+)/:recipeName', function route_showFull(req, res, next) {
	var recipeId = parseInt(req.params.recipeId);
	if (recipeId <= 0) {
		return next();
	}

	/**
	 * TODO: Redirect on correct id but wrong name
	 * res.status(301).location('/recipe/:recipeId/:recipeName');
	 * res.status(404).send('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=/recipe/:recipeId/:recipeName"></head></html>');
	 */

	res.send('/recipe/:recipeId/:recipeName');
});


router.get('/:recipeId(\\d+)*', function route_showError(req, res) {
	

	res.status(404);
	res.send('/recipe/:recipeId error');
});

router.get('/browse', function route_browse(req, res) {
	res.render('recipe/browse');
});//router.get('/browse

router.get('/create', function route_create(req, res) {

	//TODO: Recipe creator

	res.send('recipe/create');
});//router.get('/create

module.exports = router;