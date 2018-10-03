var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
	if (req.session && req.session.user){
		return res.redirect('/');
	}
	
	return res.render('login', { title: 'Login' });
});

router.get('/logout', function(req, res, next) {
	if (!req.session){
		return res.redirect('/');
	}
	
	req.session.reset();
	
	return res.redirect('/');
});

router.post('/', function(req, res, next) {
	
	if (req.body.login.trim() == 'fox'){
		req.session.user = 'fox';
		return res.json({success: true});
	}else{
		return res.json({err: "unknownUser"});
	}
	
	return res.json({err: "notImplemented"});
});

module.exports = router;
