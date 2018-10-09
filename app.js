var express = require('express');
var cookieParser = require('cookie-parser');
var sessions = require('client-sessions');
var exphbs = require('express-handlebars');

//global
path = require('path');
createError = require('http-errors');
utils = require('./utils.js');

/******************** Logging ********************/
var morgan = require('morgan');
var winston = require('winston');
require('winston-daily-rotate-file');

var winstonTransportFile = new winston.transports.DailyRotateFile({
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

//global
logFileOnly = winston.createLogger({
    transports: [winstonTransportFile],
	exitOnError: false
});

//global
log = winston.createLogger({
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

					return `${timestamp} ${level}: ${message} ${Object.keys(args).length ? '\n'+JSON.stringify(args, null, 2) : ''}`;
				})
			)
		})
	],
	exitOnError: false
});

//global
logFileOnly.stream = {
	write: function(message, encoding){
		logFileOnly.info(message);
	}
};

/******************** MySQL ********************/
var mysql      = require('mysql');
//global
db = mysql.createPool(require('./config/mysql.cfg'));

/******************** Express ********************/
var app = express();

//Let's meet
app.disable('x-powered-by');
app.use(function(req, res, next){
	res.setHeader('Server', 'Hidden');
	res.setHeader('X-Powered-By', 'Hidden');
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
	secret: 'FOR DEBUG USE ONLY MUST BE CHANGED2', //TODO: Change session.cookie.secret
	duration:   7 * 24 * 60 * 60 * 1000, //week
	activeDuration: 28 * 60 * 60 * 1000 //1d+
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

/******************** Routes ********************/
var redirectRouter = require('./routes/redirect');
var indexRouter = require('./routes/index');
var adminRouter = require('./routes/admin');
var userRouter = require('./routes/user');

app.use(redirectRouter);
app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/user', userRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};
	
	//log.error(err);// TODO: Custon format of js errors (message, status, stack
	
	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;