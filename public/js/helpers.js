var register = function(Handlebars) {
	var helpers = {
		// put all of helpers inside this object
		'default': function (a, b) {
			return a ? a : b;
		},
		length: function(value) {
			if (typeof value === 'object') {
				value = Object.keys(value);
			}
			if (typeof value === 'string' || Array.isArray(value)) {
				return value.length;
			}
			return 0;
		},
		a: function (url, text) {
			return '<a href="'+url+'">'+text+'</a>';
		}
	};

	if (Handlebars && typeof Handlebars.registerHelper === "function") {
		// register helpers
		for (var prop in helpers) {
			Handlebars.registerHelper(prop, helpers[prop]);
		}
	} else {
		// just return helpers object if we can't register helpers here
		return helpers;
	}

};

module.exports.register = register;
module.exports.helpers = register(null);