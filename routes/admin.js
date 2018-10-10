var express = require('express');
var bcrypt = require('bcrypt-nodejs');

var router = express.Router({
	caseSensitive: app.get('case sensitive routing'),
	strict: app.get('strict routing')
});

router.all('*', function(req, res, next){
	if (!req.session || !req.session.user){
		return res.redirect('/user/login');
	}
	
	if (req.session.user.toLowerCase() != 'foxbond'){
		log.info('Denied access to "'+req.originalUrl+'" for "'+req.session.user+'" ');
		return next(createError(403));
	}

	res.locals.layout = 'admin';
	res.locals.title = 'Admin';
	res.locals.originalUrl = req.originalUrl;
	
	next();
});//router.all('*'

router.get('/', function(req, res) {
	res.render('admin/index', {title: 'Admin - Index'});
});

router.all('/manageUsers', function (req, res, next){
	res.locals.title = 'Admin - ManageUsers';
	next();
});

router.get('/manageUsers', function (req, res, next) {

	db.query('SELECT users.userId, users.userName, users.userMail, group_concat(groups.groupName) as userGroups ' +
		'FROM users ' +
		'LEFT JOIN usergroups on usergroups.userId=users.userId ' +
		'LEFT JOIN groups on groups.groupId = usergroups.groupId ' +
		'GROUP BY users.userId', function (err, data) {
			if (err) {
				log.error('DB Query error! ("' + err + '")');
				return next(createError(500));
			}
			res.render('admin/manageUsers', {
				title: 'Admin - ManageUsers',
				users: data
			});
		});

});//router.get('/manageUsers'

router.get('/manageUsers/create', function(req, res) {
	res.render('admin/createUser');
});

router.post('/manageUsers/create', function(req, res, next) {
	
	if (!req.body.userMail || !req.body.userName || !req.body.userPassword){
		return res.render('admin/createUser', { 
				message: 'Fill all fields!', 
				_form: {
					mail: req.body.userMail,
					name: req.body.userName,
					password: req.body.userPassword,
					active: req.body.userActive=='on' ? 'checked' : ''
				}
			});
	}
	
	//TODO: Maybe sanitize input?
	var userMail = req.body.userMail.trim();
	var userName = req.body.userName.trim();
	var userPassword = req.body.userPassword.trim();
	var userActive = (req.body.userActive == 'on');
	
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
			
			db.query('INSERT INTO users VALUES (NULL, ?, ?, ?)', [userMail, userName, hash], function(err, data){
				if (err){
					log.error('DB Query error! ("'+err+'")');
					return next(createError(500)); 
				}
				
				db.query('INSERT INTO usergroups VALUES (?, 1)', [data.insertId], function (err){
					if (err){
						log.error('DB Query error! ("'+err+'")');
						return next(createError(500)); 
					}

					if (!userActive) {
						db.query('INSERT INTO usergroups VALUES (?, 2)', [data.insertId], function (err) {
							if (err) {
								log.error('DB Query error! ("' + err + '")');
								return next(createError(500));
							}

							res.render('admin/createUser', {
								message: 'User "' + userName + '" added!'
							});
						});
					} else {
						res.render('admin/createUser', {
							message: 'User "' + userName + '" added!'
						});
					}

					
				});
			});//db.insert
		});//db.count
	});//bcrypt.hash
});//router.post('/manageUsers/create'

router.get('/test/throwRandomError', function (req, res) {

	throw new Error('admin/throwRandomError!');

});//router.get('/test/throwRandomError'

router.get('/test/log', function (req, res) {

	log.debug('admin/throwRandomError debug');
	log.info('admin/throwRandomError info');
	log.error('admin/throwRandomError error');
	log.error('admin/throwRandomError errorAdditional', { obj: 'ert' });

});//router.get('/test/log'

module.exports = router;
