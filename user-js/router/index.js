/* eslint no-undef:0,no-unused-vars: 0*/
'use strict';
module.exports = function(app,server) {
	app.use('/jobactivity', require('./routes/jobactivity')());
	app.use('/jobs', require('./routes/jobs')());
	app.use('/schedules', require('./routes/schedules')());
};
