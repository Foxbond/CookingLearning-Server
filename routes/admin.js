var express = require('express');
var bcrypt = require('bcrypt-nodejs');

var router = express.Router();

router.all('*', function(req, res, next){
	if (!req.session || !req.session.user){
		return res.redirect('/user/login');
	}
	
	if (req.session.user.toLowerCase() != 'foxbond'){
		log.info('Denied access to "'+req.originalUrl+'" for "'+req.session.user+'" ');
		return next(createError(403));
	}
	
	res.locals.title = 'Admin';
	
	next();
});//router.all('*'

router.get('/', function(req, res) {
	res.render('admin/index', {title: 'Admin - Index'});
});

router.all('/createUser', function (req, res, next){
	res.locals.title = 'Admin - CreateUser';
	next();
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
		
		db.query('SELECT COUNT(*) as c FROM users WHERE userMail=?', [userMail], function(err, data){
			if (err){
				log.error('DB Query error! ("'+err+'")');
				return next(createError(500)); 
			}
			
			if (data[0].c != 0){
				return res.render('admin/createUser', { 
					message: 'Mail already used!', 
					_form: {
						mail: req.body.userMail,
						name: req.body.userName,
						password: req.body.userPassword
					}
				});
			}
			
			db.query('INSERT INTO users VALUES (NULL, ?, ?, ?)', [userMail, userName, hash], function(err){
				if (err){
					log.error('DB Query error! ("'+err+'")');
					return next(createError(500)); 
				}
				
				db.query('INSERT INTO usergroups VALUES (?, 1), (?, 2)', [data.insertId, data.insertId], function (err){
					if (err){
						log.error('DB Query error! ("'+err+'")');
						return next(createError(500)); 
					}
					
					res.render('admin/createUser', {
						message: 'User "'+userName+'" added!'
					});
				});
			});//db.insert
		});//db.count
	});//bcrypt.hash
});//router.post('/createUser'

router.get('/listUsers', function(req, res) {
	
	db.query('SELECT * from users', function (err, data){
		if (err){
			log.error('DB Query error! ("'+err+'")');
			return next(createError(500)); 
		}
		res.render('admin/listUsers', {
			title: 'Admin - ListUsers',
			users:data
		});
	});
	
});//router.get('/listUsers'

module.exports = router;
