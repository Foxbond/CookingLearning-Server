var express = require('express');
var bcrypt = require('bcrypt-nodejs');

var router = express.Router({
	caseSensitive: app.get('case sensitive routing'),
	strict: app.get('strict routing')
});

router.all('*', function route_star(req, res, next){
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

router.get('/', function route_root(req, res) {
	res.render('admin/index', {title: 'Admin - Index'});
});

router.all('/manageUsers', function route_manageUsers(req, res, next){
	res.locals.title = 'Admin - ManageUsers';
	next();
});

router.get('/manageUsers', function route_manageUsers(req, res, next) {

	db.query('SELECT users.userId, users.userName, users.userMail, group_concat(groups.groupName) as userGroups ' +
		'FROM users ' +
		'LEFT JOIN usergroups on usergroups.userId=users.userId ' +
		'LEFT JOIN groups on groups.groupId = usergroups.groupId ' +
		'GROUP BY users.userId', function db_getUsersData(err, data) {
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

router.get('/manageUsers/create', function route_manageUsers_create(req, res) {
	res.render('admin/createUser');
});

router.post('/manageUsers/create', function route_manageUsers_create(req, res, next) {
	
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
	
	bcrypt.hash(userPassword, null, null, function hashPassword(err, hash) {
		if (err){
			log.error('Unable to compute hash! ("'+err+'")');
			return next(createError(500)); 
		}
		
		db.query('SELECT COUNT(*) as c FROM users WHERE userMail=?', [userMail], function db_checkMail(err, data){
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
			
			db.query('INSERT INTO users VALUES (NULL, ?, ?, ?)', [userMail, userName, hash], function db_insertUser(err, data){
				if (err){
					log.error('DB Query error! ("'+err+'")');
					return next(createError(500)); 
				}
				
				db.query('INSERT INTO usergroups VALUES (?, 1)', [data.insertId], function db_setGroup(err){
					if (err){
						log.error('DB Query error! ("'+err+'")');
						return next(createError(500)); 
					}

					if (!userActive) {
						db.query('INSERT INTO usergroups VALUES (?, 2)', [data.insertId], function db_setGroup(err) {
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

router.get('/stats', function route_stats(req, res) {
	//TODO: Display data cached on last run
	res.render('admin/statsIntro');
});//router.get('/stats'

router.post('/stats', function route_stats(req, res) {
	//TODO: Fetch data from different sources in parallel (use async lib)

	db.query('SELECT table_schema as dbName, ' +
		'sum(data_length + index_length) / 1024 / 1024 as dbSize, ' +
		'sum(data_free) / 1024 / 1024 as dbFreeSpace ' +
		'FROM information_schema.TABLES ' +
		'GROUP BY table_schema; ', function db_getDbStats(err, data) {
			if (err) {
				log.error('DB Query error! ("' + err + '")');
				return next(createError(500));
			}

			res.render('admin/stats', {
				db:data[0]
			});
		});
});//router.get('/stats'

router.get('/test/throwRandomError', function route_test_throwRandomError(req, res) {

	throw new Error('admin/throwRandomError!');

});//router.get('/test/throwRandomError'

router.get('/test/log', function route_test_log(req, res) {

	log.debug('admin/throwRandomError debug');
	log.info('admin/throwRandomError info');
	log.error('admin/throwRandomError error');
	log.error('admin/throwRandomError errorAdditional', { obj: 'ert' });

});//router.get('/test/log'

module.exports = router;
