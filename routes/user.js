var bcrypt = require('bcrypt-nodejs');

var express = require('express');
var router = express.Router();

router.get('/login', function(req, res) {
	if (req.session && req.session.user){
		return res.redirect('/user');
	}
	
	return res.render('user/login');
});//router.get('/login'

router.post('/login', function(req, res, next) {
	
	if (!req.body.userMail || !req.body.userPassword){
		return res.render('user/login', {message:'Fill all fields'});
	}
	
	//TODO: Sanitize input
	var userMail = req.body.userMail.trim();
	var userPassword = req.body.userPassword;
	
	db.query('SELECT * FROM users WHERE userMail=?', [userMail], function(err, data){
		if (err){
			log.error('DB Query error! ("'+err+'")');
			return next(createError(500)); 
		}
		
		if(data.length == 0){
			return res.render('login', {message:'Unknown mail'});// There is no need to hide this information behind something like "unknown user and/or password"
		}
		
		bcrypt.compare(req.body.userPassword, data[0].userPassword, function(err, compareResult) {
			if (err){
				log.error('Unable to compute hash! ("'+err+'")');
				return next(createError(500)); 
			}
			
			if (!compareResult){
				return res.render('user/login', {message:'Invalid password'});// There is no need to hide this information behind something like "unknown user and/or password"
			}
			
			req.session.user = data[0].userName;
			return res.redirect('/');
		});
	});
});//router.post('/login'

router.all('*', function(req, res, next){
	if (!req.session || !req.session.user){
		return res.redirect('/user/login');
	}
	
	res.locals.title = 'User';
	
	next();
});//router.all('*'

router.get('/', function(req, res) {
	
	return res.render('user', {username:req.session.user});
});//router.get('/'

router.get('/logout', function(req, res) {
	
	req.session.reset();
	
	return res.redirect('/');
});//router.get('/logout'

module.exports = router;
