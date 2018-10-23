'use strict';

var express = require('express');
var app = require('../app');
var createError = require('http-errors');
var removeDiacritics = require('diacritics').remove;

var db = app.locals.db;

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
});//router.get('/show/*

router.get('/:recipeId(\\d+)', function route_showShort(req, res, next) {
	var recipeId = parseInt(req.params.recipeId);
	if (recipeId <= 0) {
		return next();
	}

	db.query('SELECT recipeUrl FROM recipes WHERE recipeId=?', [recipeId], function db_fetchRecipeUrl(err, data) {
		if (err) {
			return next(err);
		}

		if (data.length != 1) {
			return next();
		}

		res.status(301).location('/recipe/'+recipeId+'/'+data[0].recipeUrl);
	});
});//router.get('/:recipeId(\\d+)

router.get('/:recipeId(\\d+)/:recipeName', function route_showFull(req, res, next) {
	var recipeId = parseInt(req.params.recipeId);
	if (recipeId <= 0) {
		return next();
	}

	db.query('SELECT recipeUrl FROM recipes WHERE recipeId=?', [recipeId], function db_fetchRecipeUrl(err, data) {
		if (err) {
			return next(err);
		}

		if (data.length != 1) {
			//TODO: Detect and redirect if user provides correct recipeUrl but wrong recipeId
			return next();
		}

		if (req.params.recipeName != data[0].recipeUrl) {
			//Maybe it's better to redirect this way? res.status(404).send('<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=/recipe/:recipeId/:recipeName"></head></html>');
			return res.status(301).location('/recipe/' + recipeId + '/' + data[0].recipeUrl);
		}

		//Maybe better fetch all information at once (during previous query)? I guess it depends how often users hit incorrect url
		db.query('SELECT * FROM recipe WHERE recipeId=?', [recipeId], function db_fetchRecipe(err, data) {
			if (err) {
				return next(err);
			}

			//Is this check really needed?
			if (data.length != 1) {
				return next(createError(500));
			}

			//TODO: Display recipe

			res.send('/recipe/:recipeId/:recipeName<br><pre>' + JSON.stringify(data[0], null, 2)+'</pre>');
		});
	});
});//router.get('/:recipeId(\\d+)/:recipeName


router.get('/:recipeId(\\d+)*', function route_showError(req, res) {
	

	res.status(404);
	res.send('/recipe/:recipeId error');
});//router.get('/:recipeId(\\d+)*

router.get('/browse', function route_browse(req, res) {
	res.render('recipe/browse');
});//router.get('/browse

router.get('/create', function route_create(req, res) {
	
	//TODO: Recipe creator

	res.send('recipe/create');
});//router.get('/create

module.exports = router;