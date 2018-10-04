var path = require('path');

var express = require('express');
var cookieParser = require('cookie-parser');
var sessions = require("client-sessions");
var createError = require('http-errors');


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

//var keyword intentionally omitted
logFileOnly = winston.createLogger({
    transports: [winstonTransportFile],
	exitOnError: false
});

//var keyword intentionally omitted
log = winston.createLogger({
    transports: [
		winstonTransportFile,
		new winston.transports.Console({
			level: 'debug',
			handleExceptions: true,
			format: winston.format.combine(
				/* TODO: Create custom formatter to use it
				winston.format.timestamp({
					format: 'HH:mm:ss'
				}), */
				// TODO: Custon format of js errors (message, status, stack
				winston.format.colorize(),
				winston.format.simple()
			)
		})
	],
	exitOnError: false
});

logFileOnly.stream = {
	write: function(message, encoding){
		logFileOnly.info(message);
	}
};

/******************** MySQL ********************/
var mysql      = require('mysql');
db = mysql.createPool(require('./config/mysql.cfg'));



/******************** Routes ********************/
var indexRouter = require('./routes/index');
var loginRouter = require('./routes/login');

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
app.set('views', path.join(__dirname, 'views'));
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

app.use('/', indexRouter);
app.use('/login', loginRouter);

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