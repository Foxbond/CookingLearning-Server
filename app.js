var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
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


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(morgan('combined', { "stream": logFileOnly.stream }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};
	
	log.error(err);// TODO: Custon format of js errors (message, status, stack
	
	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;