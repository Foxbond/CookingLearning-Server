﻿const MailQueue = require('MailQueue');
const misc = require('../config/misc.cfg');

const mailQueue = new MailQueue({
	db: require('../config/mysql.cfg'),
	smtp: require('../config/smtp.cfg'),
	//logger: log,
	tableName: misc.mailDBTable,
	from: misc.mailServerAddr,
	numRetries: misc.mailNumRetries,
	batchLimit: misc.mailBatchLimit,
	defaultPriority: misc.mailDefaultPriority
});

const mail = {
	from: misc.mailServerAddr,
	to: misc.mailDeveloperAddr,
	subject: "Send Email Using Node.js",
	text: "text",
	html: "<b>html</b>"
}

mailQueue.send([mail], function (err, mailIds) {
	if (err) {
		console.log(err);
	}
	console.log('Sent! (mailId:' + mailIds + ')');
});