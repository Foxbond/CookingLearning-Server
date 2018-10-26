const tester = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

module.exports = {
	validate: {
		mail: function (email) {
			if (!email)
				return false;

			if (email.length > 254)
				return false;

			let valid = tester.test(email);
			if (!valid)
				return false;

			// Further checking of some things regex can't handle
			const parts = email.split("@");
			if (parts[0].length > 64)
				return false;

			const domainParts = parts[1].split(".");
			if (domainParts.some(function (part) { return part.length > 63; }))
				return false;

			return true;
		},
		username: function (str) {
			if (typeof str !== 'string') {
				throw new TypeError('Expected a string');
			}

			return !/[^0-9a-z\xDF-\xFF \-\_]/.test(str.toLowerCase());
			//return !/[^0-9a-z\xDF-\xFF]/.test(str.toLowerCase());
		}
	},
	explode: function explode(e,t,n){if(arguments.length<2||typeof e==="undefined"||typeof t==="undefined")return null;if(e===""||e===false||e===null)return false;if(typeof e==="function"||typeof e==="object"||typeof t==="function"||typeof t==="object"){return{0:""}}if(e===true)e="1";e+="";t+="";let r=t.split(e);if(typeof n==="undefined")return r;if(n===0)n=1;if(n>0){if(n>=r.length)return r;return r.slice(0,n-1).concat([r.slice(n-1).join(e)])}if(-n>=r.length)return[];r.splice(r.length+n);return r},
	contains: function (haystack, arr) {
		return arr.some(function (v) {
			return haystack.indexOf(v) >= 0;
		});
	}

}