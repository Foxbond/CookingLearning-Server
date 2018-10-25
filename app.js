'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const sessions = require('client-sessions');
const exphbs = require('express-handlebars');
const expressSlash = require('express-slash');
const MailQueue = require('MailQueue');
const path = require('path');
const createError = require('http-errors');
const misc = require('./config/misc.cfg');
const morgan = require('morgan');
const winston = require('winston');
const mysql = require('mysql');
require('winston-daily-rotate-file');


const winstonTransportFile = new winston.transports.DailyRotateFile({
	level: 'info',
	handleExceptions: true,
	filename: 'logs/%DATE%.log',
	datePattern: 'YYYY-MM-DD',
	maxFiles: '30',
	zippedArchive: true,
	format: winston.format.combine(
				winston.format.timestamp({
					format: 'YYYY-MM-DD HH:mm:ss'
				}),
				winston.format.json()
			)
});

const log = winston.createLogger({
	transports: [
		winstonTransportFile,
		new winston.transports.Console({
			level: 'debug',
			handleExceptions: true,
			format: winston.format.combine(
				winston.format.timestamp({
					format: 'HH:mm:ss'
				}),
				winston.format.colorize(),
				winston.format.printf((info) => {
					const {
						timestamp, level, message, ...args
					} = info;

					return `${timestamp} ${level}: ${message} ${Object.keys(args).length ? '\n' + JSON.stringify(args, null, 2) : ''}`;
				})
			)
		})
	],
	exitOnError: false
});

const logFileOnly = winston.createLogger({
    transports: [winstonTransportFile],
	exitOnError: false
});

logFileOnly.stream = {
	write: function (message, encoding) {
		logFileOnly.info(message);
	}
};

const db = mysql.createPool(require('./config/mysql.cfg'))

/******************** Express ********************/
const app = express();

//I'm a masochist
app.enable('strict routing');
app.enable('case sensitive routing');
//TODO: There is bug with strict routing on root path in nested routes, /admin and /admin/ is both valid, SEE: https://github.com/expressjs/express/issues/2281

app.locals.log = log;
app.locals.logFileOnly = logFileOnly;
app.locals.db = db;
app.locals.mailQueue = new MailQueue({
	db: db,
	smtp: require('./config/smtp.cfg'),
	logger: log,
	tableName: misc.mailDBTable,
	from: misc.mailServerAddr,
	numRetries: misc.mailNumRetries,
	batchLimit: misc.mailBatchLimit,
	defaultPriority: misc.mailDefaultPriority
});

//Let's meet
app.disable('x-powered-by');
app.use(function app_setServerHeaders(req, res, next){
	res.setHeader('Server', misc.serverName);
	res.setHeader('X-Powered-By', misc.serverName);
	/* res.setHeader('Access-Control-Allow-Origin', ''); */
	next();
});

// tpl engine
app.engine('hbs', exphbs({
	defaultLayout: 'main',
	extname: '.hbs',
	helpers: require('./public/js/helpers.js').helpers, // same file that gets used on our client
	partialsDir: 'views/partials/', // same as default
	layoutsDir: 'views/layouts/' // same as default
}));
app.set('view engine', 'hbs');

// http logging
app.use(morgan('combined', { "stream": logFileOnly.stream }));
app.use(morgan('dev'));

//sessions
app.use(sessions({
	cookieName: 'session',
	secret: misc.cookieKey,
	duration:   misc.cookieDuration, 
	activeDuration: misc.cookieActiveDuration 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;

/******************** Routes ********************/
const redirectRouter = require('./routes/redirect');
const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const userRouter = require('./routes/user');
const recipeRouter = require('./routes/recipe');

app.use(redirectRouter);
app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/user', userRouter);
app.use('/recipe', recipeRouter);


//handle trailing-slash routing errors
app.use(expressSlash());

// catch 404 and forward to error handler
app.use(function app_catch404(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function app_errorHandler(err, req, res, next) {
	log.error(err.message, err);

	//TODO: Pretty error for end user depending on err.message

	if (req.app.get('env') === 'development') {
		if (err.message.indexOf(':') != -1) {
			res.locals.errorType = err.message.split(':')[0];
			res.locals.errorMessage = err.message.split(':')[1];
		} else {
			res.locals.errorMessage = err.message;
		}
		res.locals.error = err;
	} else {
		if (err.message.indexOf(':') != -1) {
			res.locals.errorType = err.message.split(':')[0];
			res.locals.errorMessage = '';
		} else {
			res.locals.errorMessage = err.message;
		}
		res.locals.error = {};
	}	
	
	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

