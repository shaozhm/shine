var xsenv = require('sap-xsenv');

module.exports = {
	callback: function(error, res, message) {
		if (error) {
			res.writeHead(500, {
				'Content-Type': 'application/json'
			});
			res.end(JSON.stringify(error));
		} else {
			res.writeHead(200, {
				'Content-Type': 'application/json'
			});
			res.end(JSON.stringify({
				message: message
			}));
		}
	},
	appconfig: function() {
        var services = xsenv.getServices({jobscheduler:{ tag: "jobscheduler" }}).jobscheduler;
		return {
			timeout: 15000,
    		user: services.user,
    		password: services.password,
    		baseURL: services.url
		};
	}
};