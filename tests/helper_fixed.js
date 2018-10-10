var fixed = require('../public/js/helpers').helpers.fixed;

var values = [
	10, '10',
	1.1, '1.1',
	2.22, '2.22',
	3.333, '3.333',
	4.444, '4.4444', '4,4444'
];


values.forEach(function (val) {
	console.log(val + '\t' + fixed(val, 0) + '\t' + fixed(val, 2));
});