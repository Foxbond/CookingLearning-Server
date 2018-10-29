module.exports = {
	serverAddr: 'http://localhost:3000',
	serverName: 'Hidden',
	cookieName: 'CookingLearning_session',
	cookieKey: 'FOR DEBUG USE ONLY MUST BE CHANGED',
	cookieDuration: 7 * 24 * 60 * 60 * 1000, //week
	cookieActiveDuration: 28 * 60 * 60 * 1000, //1d+
	mailServerAddr: 'mailqueue@localhost',
	mailDeveloperAddr: 'dev@localhost',
	mailDBTable: 'mailQueue',
	mailNumRetries: 3,
	mailBatchLimit: 10,
	mailDefaultPriority: 0,
	activationTokenExpiry: 48 * 60 * 60 * 1000, //2d
	recoveryTokenExpiry: 24 * 60 * 60 * 1000 //1d
};