'use strict';

var express = require('express');
var bcrypt = require('bcrypt-nodejs');
var getFolderSize = require('get-folder-size');
var async = require('async');
var app = require('../app');
var createError = require('http-errors');

var log = app.locals.log;
var db = app.locals.db;

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
		'GROUP BY users.userId', function db_fetchUsers(err, data) {
			if (err) {
				return next(err);
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
			if (err) {
				return next(err);
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
				if (err) {
					return next(err);
				}
				
				db.query('INSERT INTO usergroups VALUES (?, 1)', [data.insertId], function db_setGroup(err){
					if (err) {
						return next(err);
					}

					if (!userActive) {
						db.query('INSERT INTO usergroups VALUES (?, 2)', [data.insertId], function db_setGroup(err) {
							if (err) {
								return next(err);
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

router.get('/manageUsers/modify/:userId', function router_manageUsers_modify(req, res, next) {
	var userId = parseInt(req.params.userId);
	if (userId <= 0) {
		return res.redirect('/admin/manageUsers');
	}

	db.query('SELECT users.userId, users.userName, users.userMail, users.userPassword, group_concat(groups.groupName) as userGroups ' +
		'FROM users ' +
		'LEFT JOIN usergroups on usergroups.userId=users.userId ' +
		'LEFT JOIN groups on groups.groupId = usergroups.groupId ' +
		'WHERE users.userId=? ' +
		'GROUP BY users.userId', [userId], function db_fetchUser(err, data) {
			if (err) {
				return next(err);
			}

			if (data.length == 0) {
				return res.redirect('/admin/manageUsers');
			}

			var groups = data[0].userGroups.split(',');

			res.render('admin/modifyUser', {
				userData: data[0],
				userNotActivated: (groups.indexOf('NotActivated') != -1 || groups.indexOf('Suspended') != -1),
				userNotSuspended: (groups.indexOf('Suspended') == -1)
			});
		});
});//router.get('/manageUsers/modify/:userId'

router.post('/manageUsers/modify/:userId', function route_manageUsers_modify(req, res, next) {
	var userId = parseInt(req.params.userId);
	if (userId <= 0) {
		return res.redirect('/admin/manageUsers');
	}

	if (userId !== parseInt(req.body.userId)) {
		return res.redirect('/admin/manageUsers');
	}

	db.query('UPDATE users SET userName=?, userMail=? WHERE userId=?', [req.body.userName, req.body.userMail, userId], function db_updateUser(err) {
		if (err) {
			return next(err);
		}

		return res.redirect('/admin/manageUsers');
	});
});//router.post('/manageUsers/modify/:userId'

router.get('/manageUsers/remove/:userId', function route_manageUsers_remove(req, res, next) {
	var userId = parseInt(req.params.userId);
	if (userId <= 0) {
		return res.redirect('/admin/manageUsers');
	}

	db.query('SELECT users.userId, users.userName, users.userMail, group_concat(groups.groupName) as userGroups ' +
		'FROM users ' +
		'LEFT JOIN usergroups on usergroups.userId=users.userId ' +
		'LEFT JOIN groups on groups.groupId = usergroups.groupId ' +
		'WHERE users.userId=? ' +
		'GROUP BY users.userId', [userId], function db_fetchUser(err, data) {
			if (err) {
				return next(err);
			}

			if (data.length == 0) {
				return res.redirect('/admin/manageUsers');
			}

			res.render('admin/removeUser', {
				userData: JSON.stringify(data[0], null, 2),
				userId: userId
			});
		});

});//router.get('/manageUsers/remove/:userId'

router.post('/manageUsers/remove/:userId', function route_manageUsers_remove(req, res, next) {
	var userId = parseInt(req.params.userId);
	if (userId <= 0) {
		return res.redirect('/admin/manageUsers');
	}

	if (userId !== parseInt(req.body.userId)) {
		return res.redirect('/admin/manageUsers');
	}

	db.query('DELETE FROM users WHERE userId=?', [userId], function db_removeUser(err) {
		if (err) {
			return next(err);
		}

		return res.redirect('/admin/manageUsers');
	});
});//router.post('/manageUsers/remove/:userId'

router.get('/manageUsers/activate/:userId', function route_manageUsers_activate(req, res, next) {
	var userId = parseInt(req.params.userId);
	if (userId <= 0) {
		return res.redirect('/admin/manageUsers');
	}

	db.query('SELECT users.userId, users.userName, group_concat(groups.groupName) as userGroups ' +
		'FROM users ' +
		'LEFT JOIN usergroups on usergroups.userId=users.userId ' +
		'LEFT JOIN groups on groups.groupId = usergroups.groupId ' +
		'WHERE users.userId=? ' +
		'GROUP BY users.userId', [userId], function db_fetchUser(err, data) {
		if (err) {
			return next(err);
		}

		if (data.length == 0) {
			return res.redirect('/admin/manageUsers');
		}

		var groups = data[0].userGroups.split(',');

		async.series([
			function activateAccount(callback) {
				if (groups.indexOf('NotActivated') == -1) {
					callback();
					return;
				}

				db.query('DELETE FROM usergroups WHERE userId=? AND groupId=2', [data[0].userId], function db_removeUserGroup(err) {
					if (err) {
						callback(err);
						return;
					}

					db.query('DELETE FROM activationsessions WHERE userId=?', [data[0].userId], function db_removeActivationSession(err) {
						if (err) {
							callback(err);
							return;
						}

						callback();
					});
				});
			}, function removeSuspension(callback) {
				if (groups.indexOf('Suspended') == -1) {
					callback();
				}

				db.query('DELETE FROM usergroups WHERE userId=? AND groupId=4', [data[0].userId], function db_removeUserGroup(err) {
					if (err) {
						callback(err);
						return;
					}

					callback();
				});
		}], function userAccActivated(err) {
			if (err) {
				return next(err);
			}

			res.redirect('/admin/manageUsers/modify/' + data[0].userId);
		});	
	});
});//router.get('/manageUsers/activate/:userId'

router.get('/manageUsers/suspend/:userId', function route_manageUsers_suspend(req, res, next) {
	var userId = parseInt(req.params.userId);
	if (userId <= 0) {
		return res.redirect('/admin/manageUsers');
	}

	//TODO: Check if user is already suspended

	db.query('INSERT INTO usergroups VALUES (?, 4)', [userId], function db_addUserGroup(err) {
		if (err) {
			return next(err);
		}

		return res.redirect('/admin/manageUsers/modify/'+userId);
	});
});//router.get('/manageUsers/suspend/:userId'

router.get('/stats', function route_stats(req, res) {
	//TODO: Display data cached on last run
	res.render('admin/statsIntro');
});//router.get('/stats'

router.post('/stats', function route_stats(req, res, next) {
	//TODO: Fetch data from different sources in parallel (use async lib)

	db.query('SELECT table_schema as dbName, ' +
		'sum(data_length + index_length) / 1024 / 1024 as dbSize, ' +
		'sum(data_free) / 1024 / 1024 as dbFreeSpace ' +
		'FROM information_schema.TABLES ' +
		'GROUP BY table_schema; ', function db_getDbStats(err, data) {
			if (err) {
				return next(err);
			}

			getFolderSize('logs', function fs_getLogsSize(err, logsSize) {
				res.render('admin/stats', {
					db: data[0],
					logSize: logsSize / 1024 / 1024
				});
			});
			
		});
});//router.get('/stats'

router.get('/test/throwRandomError', function route_test_throwRandomError(req, res) {

	throw new Error('admin/throwRandomError!');

});//router.get('/test/throwRandomError'

router.get('/test/mysqlError', function route_test_mysqlError(req, res, next) {

	db.query('slct', function genMysqlError(err, data) {
		next(err);
	});

});//router.get('/test/mysqlerror'

router.get('/test/log', function route_test_log(req, res) {

	log.debug('admin/throwRandomError debug');
	log.info('admin/throwRandomError info');
	log.error('admin/throwRandomError error');
	log.error('admin/throwRandomError errorAdditional', { obj: 'ert' });

});//router.get('/test/log'

module.exports = router;