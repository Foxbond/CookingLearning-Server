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
		},
		generateNav: function (url) {
			if (url[0] == '/') {
				url = url.substring(1);
			}
			var pages = url.split('/');
			var path = '';
			var result = '<span class="autogeneratedNav">';
			for (var i = 0; i < (pages.length - 1); i++) {
				path += '/'+pages[i];
				result += '<a href="'+path+'">'+pages[i]+'</a> -&gt; ';
			}

			return result + '</span><h2>' + pages[pages.length - 1].charAt(0).toUpperCase() + pages[pages.length - 1].slice(1) + '</h2>';
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