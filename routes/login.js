var express = require('express');
var router = express.Router();


router.get('/', function(req, res) {
	if (req.session && req.session.user){
		return res.redirect('/');
	}
	
	return res.render('login', { title: 'Login' });
});

router.get('/logout', function(req, res) {
	if (!req.session || !req.session.user){
		return res.redirect('/');
	}
	
	req.session.reset();
	
	return res.redirect('/');
});

router.post('/', function(req, res) {
	
	if (req.body.password.trim() == 'fox'){
		req.session.user = req.body.login;
		return res.json({success: true});
	}else{
		return res.json({err: "invalidPassword"});
	}
	
	return res.json({err: "notImplemented"});
});

module.exports = router;
