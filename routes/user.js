var bcrypt = require('bcrypt-nodejs');
var express = require('express');

var router = express.Router({
	caseSensitive: app.get('case sensitive routing'),
	strict: app.get('strict routing')
});

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
	
	db.query('SELECT users.userName, users.userPassword, group_concat(usergroups.groupId) as userGroups '+
		'FROM users '+ 
		'LEFT JOIN usergroups on usergroups.userId=users.userId '+
		'WHERE users.userMail=?', [userMail], function(err, data){
		if (err){
			log.error('DB Query error! ("'+err+'")');
			return next(createError(500)); 
		}
		
		if(data.length == 0){
			return res.render('user/login', {message:'Unknown mail'});// There is no need to hide this information behind something like "unknown user and/or password"
		}
		
		//TODO: Create user group parser
		if (utils.contains(data[0].userGroups.split(','), ['2'])){
			return res.render('user/login', {message:'Your account is not activated!'});//TODO: Provide resend option
		}
		
		if (utils.contains(data[0].userGroups.split(','), ['3', '4'])){
			return res.render('user/login', {message:'Your account is disabled!'});//TODO: Resolve cause/provide explanation
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

router.all('/register/', function (req, res) {
	return res.redirect('/user/register');
});//router.get('/register/'

router.get('/register', function(req, res) {
	
	return res.render('user/register');
});//router.get('/register'

router.post('/register', function(req, res) {
	if (!req.body.userMail || !req.body.userName || !req.body.userPassword || !req.body.userPassword2){
		return res.render('user/register', { 
			message: 'Fill all fields!', 
			_form: {
				mail: req.body.userMail,
				name: req.body.userName
			}
		});
	}
	
	if (req.body.userPassword !== req.body.userPassword2) {
		return res.render('user/register', { 
			message: 'Passwords dont match!', 
			_form: {
				mail: req.body.userMail,
				name: req.body.userName
			}
		});
	}
	
	var userName = req.body.userName.trim(); //TODO: Validate user name
	var userMail = req.body.userMail.trim();
	var userPassword = req.body.userPassword; //TODO: Check password complexity
	
	if (userName.length < 3 || userName.length > 20){
		return res.render('user/register', { 
			message: 'Username must be between 3 and 20 characters!', 
			_form: {
				mail: req.body.userMail,
				name: req.body.userName
			}
		});
	}
	
	if (!utils.validate.username(userName)){
		return res.render('user/register', { 
			message: 'Name must be alphanumeric!', 
			_form: {
				mail: req.body.userMail,
				name: req.body.userName
			}
		});
	}
	
	if (!utils.validate.mail(userMail)){
		return res.render('user/register', { 
			message: 'Provide correct e-mail address!', 
			_form: {
				mail: req.body.userMail,
				name: req.body.userName
			}
		});
	}
	
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
				return res.render('user/register', { 
					message: 'Mail already used!', 
					_form: {
						mail: req.body.userMail,
						name: req.body.userName
					}
				});
			}
			
			db.query('INSERT INTO users VALUES (NULL, ?, ?, ?)', [userMail, userName, hash], function(err, data){
				if (err){
					log.error('DB Query error! ("'+err+'")');
					return next(createError(500)); 
				}
				
				db.query('INSERT INTO usergroups VALUES (?, 1), (?, 2)', [data.insertId, data.insertId], function (err){
					if (err){
						log.error('DB Query error! ("'+err+'")');
						return next(createError(500)); 
					}
					
					res.render('user/registerComplete');
				});
				
				
			});
		});
	});
	
});//router.post('/register'

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
