'use strict';

const bcrypt = require('bcrypt-nodejs');
const express = require('express');
const app = require('../app');
const utils = require('../utils');
const misc = require('../config/misc.cfg');

const log = app.locals.log;
const db = app.locals.db;

const router = express.Router({
	caseSensitive: app.get('case sensitive routing'),
	strict: app.get('strict routing')
});

router.get('/login', function route_login(req, res) {
	if (req.session && req.session.user) {
		return res.redirect('/user');
	}

	return res.render('user/login');
});//router.get('/login'

router.post('/login', function route_login(req, res, next) {
	if (req.session && req.session.user) {
		return res.redirect('/user');
	}

	if (!req.body.userMail || !req.body.userPassword) {
		return res.render('user/login', { message: 'Fill all fields' });
	}

	//TODO: Sanitize input
	const userMail = req.body.userMail.trim();

	db.query('SELECT users.userName, users.userPassword, group_concat(usergroups.groupId) as userGroups ' +
		'FROM users ' +
		'LEFT JOIN usergroups on usergroups.userId=users.userId ' +
		'WHERE users.userMail=? ' +
		'GROUP BY users.userId', [userMail], function db_getUserData(err, data) {
			if (err) { return next(err); }

			if (data.length != 1) {
				return res.render('user/login', { message: 'Unknown mail' });// There is no need to hide this information behind something like "unknown user and/or password"
			}

			//TODO: Create user group parser
			if (utils.contains(data[0].userGroups.split(','), ['2'])) {
				return res.render('user/login', { message: 'Your account is not activated!' });//TODO: Provide resend option
			}

			if (utils.contains(data[0].userGroups.split(','), ['3', '4'])) {
				return res.render('user/login', { message: 'Your account is disabled!' });//TODO: Resolve cause/provide explanation
			}

			bcrypt.compare(req.body.userPassword, data[0].userPassword, function (err, compareResult) {
				if (err) {
					log.error('Unable to compute hash! ("' + err + '")');
					return next(createError(500));
				}

				if (!compareResult) {
					return res.render('user/login', { message: 'Invalid password' });// There is no need to hide this information behind something like "unknown user and/or password"
				}

				req.session.user = data[0].userName;
				return res.redirect('/');
			});
		});
});//router.post('/login'

router.all('/register/', function route_register(req, res) {
	return res.redirect('/user/register');
});//router.get('/register/'

router.get('/register', function route_register(req, res) {
	if (req.session && req.session.user) {
		return res.redirect('/user');
	}

	return res.render('user/register');
});//router.get('/register'

router.post('/register', function route_register(req, res) {
	if (req.session && req.session.user) {
		return res.redirect('/user');
	}

	if (!req.body.userMail || !req.body.userName || !req.body.userPassword || !req.body.userPassword2) {
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

	const userName = req.body.userName.trim(); //TODO: Validate user name
	const userMail = req.body.userMail.trim();
	const userPassword = req.body.userPassword; //TODO: Check password complexity

	if (userName.length < 3 || userName.length > 20) {
		return res.render('user/register', {
			message: 'Username must be between 3 and 20 characters!',
			_form: {
				mail: req.body.userMail,
				name: req.body.userName
			}
		});
	}

	if (!utils.validate.username(userName)) {
		return res.render('user/register', {
			message: 'Name must be alphanumeric!',
			_form: {
				mail: req.body.userMail,
				name: req.body.userName
			}
		});
	}

	if (!utils.validate.mail(userMail)) {
		return res.render('user/register', {
			message: 'Provide correct e-mail address!',
			_form: {
				mail: req.body.userMail,
				name: req.body.userName
			}
		});
	}

	bcrypt.hash(userPassword, null, null, function hashPassword(err, hash) {
		if (err) {
			log.error('Unable to compute hash! ("' + err.message + '")', err);
			return next(createError(500));
		}

		db.query('SELECT COUNT(*) as c FROM users WHERE userMail=?', [userMail], function db_checkMail(err, data) {
			if (err) { return next(err); }

			if (data[0].c != 0) {
				return res.render('user/register', {
					message: 'Mail already used!',
					_form: {
						mail: req.body.userMail,
						name: req.body.userName
					}
				});
			}

			db.query('INSERT INTO users VALUES (NULL, ?, ?, ?)', [userMail, userName, hash], function db_insertUser(err, data) {
				if (err) { return next(err); }

				//TODO: Second query AND mail AND page rendering can be run in parallel
				db.query('INSERT INTO usergroups VALUES (?, 1), (?, 2)', [data.insertId, data.insertId], function db_insertGroups(err) {
					if (err) { return next(err); }

					const token = require('nanoid/generate')('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16);

					db.query('INSERT INTO usertokens VALUES ((SELECT userId FROM users WHERE userMail=?), ?, ?, 1)', [userMail, (+new Date()), token], function db_addActivationToken(err) {
						if (err) { return next(err); }

						let mail = {
							from: misc.mailServerAddr,
							to: userMail,
							subject: 'Activate your account',
							text: 'Activation token: ' + token + ' \r\nGo to ' + misc.serverAddr + '/user/activate to activate your account.',
							html: 'Activation token: <b>' + token + '</b><br><a href="' + misc.serverAddr + '/user/activate/' + token + '">Click here</a> to activate your account.'//TODO: Use handlebars tpls for mails
						}

						req.app.locals.mailQueue.send([mail], function mail_sendActivationMail(err, mailIds) {
							if (err) { return next(err); }

							res.render('user/registerComplete');
						});
					});
				});
			});
		});
	});
});//router.post('/register'

router.get('/activate', function route_activate(req, res) {
	if (req.session && req.session.user) {
		return res.redirect('/user');
	}

	res.render('user/activateForm');
});//router.get('/activate'

router.post('/activate', function route_activate(req, res) {
	if (req.session && req.session.user) {
		return res.redirect('/user');
	}

	if (!req.body.token) {
		return res.redirect('/user/activate');
	}

	res.redirect('/user/activate/' + req.body.token.trim());
});//router.post('/activate'

router.get('/activate/:token', function route_activate(req, res) {
	if (req.session && req.session.user) {
		return res.redirect('/user');
	}

	let token = req.params.token.trim();
	if (token.length != 16) {
		return res.render('user/activateForm', {
			message: 'Invalid token'
		});
	}

	db.query('SELECT userId, tokenCreated FROM usertokens WHERE tokenValue=? AND tokenType=1', [token], function db_getActivationToken(err, data) {
		if (err) { return next(err); }

		if (data.length != 1) {
			return res.render('user/activateForm', {
				message: 'Invalid token'
			});
		}

		if (data[0].tokenCreated + misc.activationTokenExpiry < (+new Date())) {
			return res.render('user/activateForm', {
				message: 'Token expired'
			});
		}

		db.query('DELETE FROM usergroups WHERE userId=? AND groupId=2', [data[0].userId], function db_removeUserGroup(err) {
			if (err) { return next(err); }

			db.query('DELETE FROM usertokens WHERE userId=? AND tokenType=1', [data[0].userId], function db_removeActivationTokens(err) {
				if (err) {
					log.error('DB Query error! ("' + err.message + '")', err);
				}
			});

			return res.render('user/activateForm', {
				message: 'Success!',
				hideForm: true
			});
		});
	});
});//router.get('/activate/:token'

router.get('/recover', function route_recover(req, res) {
	if (req.session && req.session.user) {
		return res.redirect('/user');
	}

	res.render('user/recover');
});//router.get('/recover

router.post('/recover', function route_recover(req, res) {
	if (req.session && req.session.user) {
		return res.redirect('/user');
	}

	if (!req.body.userMail) {
		return res.render('user/recover', { message: 'Please provide e-mail address!' });
	}

	const userMail = req.body.userMail.trim();

	if (!utils.validate.mail(userMail)) {
		return res.render('user/recover', { message: 'Provide correct e-mail address!' });
	}

	db.query('SELECT users.userId, group_concat(usergroups.groupId) as userGroups ' +
		'FROM users ' +
		'LEFT JOIN usergroups on usergroups.userId=users.userId ' +
		'WHERE users.userMail=? ' +
		'GROUP BY users.userId', [userMail], function db_checkMail(err, data) {
			if (err) { return next(err); }

			if (data.length != 1) {
				return res.render('user/recover', {
					message: 'User with specified e-mail cannot be found!',
					email: userMail
				});
			}

			if (data[0].userId == 1) {
				return res.render('user/recover', { message: "I'm sorry, Dave. I'm afraid I can't do that." });
			}

			const userGroups = data[0].userGroups.split(',');

			if (utils.contains(userGroups, ['3', '4'])) {
				return res.render('user/recover', { message: 'Your account is disabled and/or banned! Please contact support.' });
			}

			if (utils.contains(userGroups, ['2'])) {
				return res.render('user/recover', { message: 'Your account is not activated!' });//TODO: Provide resend option
			}

			const token = require('nanoid/generate')('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16);

			db.query('INSERT INTO usertokens VALUES (?, ?, ?, 2)', [data[0].userId, (+new Date()), token], function db_addRecoveryToken(err) {
				if (err) { return next(err); }

				let mail = {
					from: misc.mailServerAddr,
					to: userMail,
					subject: 'Recover your account',
					text: 'Recovery token: ' + token + ' \r\nGo to ' + misc.serverAddr + '/user/recover/' + token + ' to activate your account.',
					html: 'Recovery token: <b>' + token + '</b><br><a href="' + misc.serverAddr + '/user/recover/' + token + '">Click here</a> to recover your account.'//TODO: Use handlebars tpls for mails
				}

				req.app.locals.mailQueue.send([mail], function mail_sendActivationMail(err, mailIds) {
					if (err) { return next(err); }

					res.render('user/recover', { message: 'Mail with instructions has been sent!', hideForm: true });
				});
			});
		});
});//router.post('/recover

router.all('/recover/:token', function route_recover(req, res) {
	if (req.session && req.session.user) {
		return res.redirect('/user');
	}

	let token = req.params.token.trim();
	if (token.length != 16) {
		return res.render('user/recover', {
			message: 'Invalid token'
		});
	}

	db.query('SELECT userId, tokenCreated FROM usertokens WHERE tokenValue=? AND tokenType=2', [token], function db_getRecoveryToken(err, data) {
		if (err) { return next(err); }

		if (data.length != 1) {
			return res.render('user/recover', { message: 'Invalid token' });
		}

		if (data[0].tokenCreated + misc.recoveryTokenExpiry < (+new Date())) {
			return res.render('user/recover', { message: 'Token expired' });
		}

		if (req.method === 'GET') {
			return res.render('user/recover_passwordForm', { token: token });
		}

		if (!req.body.userPassword || !req.body.userPassword2) {
			return res.render('user/recover_passwordForm', { message: 'Fill all fields!' });
		}

		if (req.body.userPassword !== req.body.userPassword2) {
			return res.render('user/recover_passwordForm', { message: 'Passwords dont match!' });
		}

		const userPassword = req.body.userPassword; //TODO: Check password complexity

		bcrypt.hash(userPassword, null, null, function hashPassword(err, hash) {
			if (err) {
				log.error('Unable to compute hash! ("' + err.message + '")', err);
				return next(createError(500));
			}

			db.query('UPDATE users SET userPassword=? WHERE userId=?', [hash, data[0].userId], function db_updateUserPassword(err) {
				if (err) { return next(err); }

				db.query('DELETE FROM usertokens WHERE userId=? AND tokenType=2', [data[0].userId], function db_removeRecoveryTokens(err) {
					if (err) {
						log.error('DB Query error! ("' + err.message + '")', err);
					}
				});

				return res.render('user/recover_passwordForm', {
					message: 'Success!',
					hideForm: true
				});
			});
		});
	});
});//router.all('/recover/:token

router.all('*', function route_star(req, res, next) {
	if (!req.session || !req.session.user) {
		return res.redirect('/user/login');
	}

	res.locals.title = 'User';

	next();
});//router.all('*'

router.get('/', function route_root(req, res) {

	return res.render('user', { username: req.session.user });
});//router.get('/'

router.get('/logout', function route_logout(req, res) {

	req.session.reset();

	return res.redirect('/');
});//router.get('/logout'

module.exports = router;