module.exports = {
	pool: true,
	maxConnections: 5,
	maxMessages: 100,
	host: 'localhost',
	port: 465,
	secure: true, // use TLS
	auth: {
		user: 'user@localhost',
		pass: 'pass'
	}
};