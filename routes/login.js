var bcrypt = require('bcrypt-nodejs');

var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
	if (req.session && req.session.user){
		return res.redirect('/');
	}
	
	return res.render('login');
});

router.get('/logout', function(req, res) {
	if (!req.session || !req.session.user){
		return res.redirect('/');
	}
	
	req.session.reset();
	
	return res.redirect('/');
});

router.post('/', function(req, res, next) {
	
	if (!req.body.userMail || !req.body.userPassword){
		return res.render('login', {message:'Fill all fields'});
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
				return res.render('login', {message:'Invalid password'});// There is no need to hide this information behind something like "unknown user and/or password"
			}
			
			req.session.user = data[0].userName;
			return res.redirect('/');
		});
	});
});

module.exports = router;
