//https://github.com/kelektiv/node.bcrypt.js
var bcrypt = require('bcrypt-nodejs');

var hash = bcrypt.hashSync("bacon");

bcrypt.compareSync("bacon", hash); // true
bcrypt.compareSync("veggies", hash); // false

bcrypt.hash("bacon", null, null, function(err, hash) {
    // Store hash in your password DB.
});

// Load hash from your password DB.
bcrypt.compare("bacon", hash, function(err, res) {
    // res == true
});
bcrypt.compare("veggies", hash, function(err, res) {
    // res = false
});

var result = bcrypt.hashSync('test');
var result2 = bcrypt.hashSync('test', bcrypt.genSaltSync(8));
console.log('test (ns)-> '+result);
console.log('test (ws)-> '+result2);
console.log('compare result: '+bcrypt.compareSync('test', result));
console.log('compare result: '+bcrypt.compareSync('test', result2));