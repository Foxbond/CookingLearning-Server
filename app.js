var express = require('express');
var cookieParser = require('cookie-parser');
var sessions = require('client-sessions');
var exphbs = require('express-handlebars');
var expressSlash = require('express-slash');;
var misc = require('config/misc.cfg');

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
app = express();

//I'm a masochist
app.enable('strict routing');
app.enable('case sensitive routing');
//TODO: There is bug with strict routing on root path in nested routes, /admin and /admin/ is both valid, SEE: https://github.com/expressjs/express/issues/2281

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
	secret: misc.cookieKey, //TODO: Change session.cookie.secret
	duration:   misc.cookieDuration, 
	activeDuration: misc.cookieActiveDuration 
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

//handle trailing-slash routing errors
app.use(expressSlash());

// catch 404 and forward to error handler
app.use(function app_catch404(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function app_errorHandler(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};
	
	log.error(err.message, err);
	
	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;