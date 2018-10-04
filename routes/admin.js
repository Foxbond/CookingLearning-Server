var express = require('express');
var router = express.Router();

router.all('*', function(req, res, next){
	if (!req.session || !req.session.user){
		return res.redirect('/login');
	}
	
	if (req.session.user.toLowerCase() != 'foxbond'){
		log.info('Denied access to "'+req.originalUrl+'" for "'+req.session.user+'" ');
		return next(createError(403));
	}
	
	next();
});

router.get('/', function(req, res, next) {
	res.render('admin/index');
});

module.exports = router;
