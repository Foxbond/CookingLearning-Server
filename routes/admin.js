var express = require('express');
var bcrypt = require('bcrypt-nodejs');

var router = express.Router();

router.all('*', function(req, res, next){
	if (!req.session || !req.session.user){
		return res.redirect('/login');
	}
	
	if (req.session.user.toLowerCase() != 'foxbond'){
		log.info('Denied access to "'+req.originalUrl+'" for "'+req.session.user+'" ');
		return next(createError(403));
	}
	
	next();
});

router.get('/', function(req, res) {
	res.render('admin/index');
});

router.get('/createUser', function(req, res) {
	res.render('admin/createUser');
});

router.post('/createUser', function(req, res, next) {
	
	if (!req.body.userMail || !req.body.userName || !req.body.userPassword){
		return res.render('admin/createUser', { 
				message: 'Fill all fields!', 
				_form: {
					mail: req.body.userMail,
					name: req.body.userName,
					password: req.body.userPassword
				}
			});
	}
	
	//TODO: Maybe sanitize input?
	var userMail = req.body.userMail.trim();
	var userName = req.body.userName.trim();
	var userPassword = req.body.userPassword.trim();
	
	bcrypt.hash(userPassword, null, null, function(err, hash) {
		if (err){
			log.error('Unable to compute hash! ("'+err+'")');
			return next(createError(500)); 
		}
		
		db.query('INSERT INTO users VALUES (NULL, ?, ?, ?)', [userMail, userName, hash], function(err){
			if (err){
				log.error('DB Query error! ("'+err+'")');
				return next(createError(500)); 
			}
			
			res.render('admin/createUser', {
				message: 'User "'+userName+'" added!'
			});
		});
	});
});//router.post('/createUser'

router.get('/listUsers', function(req, res) {
	
	db.query('SELECT * from users', function (err, data){
		if (err){
			log.error('DB Query error! ("'+err+'")');
			return next(createError(500)); 
		}
		console.log(data);
		res.render('admin/listUsers', {users:data});
	});
	
});//router.get('/listUsers'

module.exports = router;
