"use strict";
var path = require('path');
module.exports = function(app, server){
	app.use("/integrationTestResult", require("./routes/runTest")());
	app.get("/assets/app.js", function(req, res) {
		res.sendFile(path.join(__dirname+'/mochawesome-report/assets/app.js'));
    });
    app.get("/assets/app.css", function(req, res) {
		res.sendFile(path.join(__dirname+'/mochawesome-report/assets/app.css'));
    });

};

