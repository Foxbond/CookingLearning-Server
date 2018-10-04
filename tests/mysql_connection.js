var mysql      = require('mysql');
var db = mysql.createConnection(require('../config/mysql.cfg'));

db.connect(function (err){
	if (err){
		console.log(err);
	}else{
		console.log('Success!');
	}
});

db.end();