/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
"use strict";
var express = require("express");
var path    = require("path");
var fs		= require("fs");
var Mocha = require('mocha');
var results = require('./../../utils/results.js');
var data = {};
module.exports = function() {
	var app = express.Router();

	app.get("/", function(req, res) {
		
		global.__base = __dirname + "/";
		var init = require(global.__base + "../../utils/initialize");
		init.runTest();
		
		// Instantiate a Mocha instance.
		var mocha = new Mocha({
		  reporter: 'json'/*,
		  reporterOptions: {
		    reportFilename: 'Report',
		    quiet: true,
		    html:true
		  }*/
		});
		var testDir = __dirname+"/../../utils/test";
		
		// Add each .js file to the mocha instance
		fs.readdirSync(testDir).filter(function(file){
		    // Only keep the .js files
		    return file.substr(-3) === '.js';

		}).forEach(function(file){
		    mocha.addFile(
			path.join(testDir, file)
		    );
		});
				
		mocha.run().on('end', function() {
		    data = this.testResults;
		    results.test=this.testResults;
		});
		
		
		
		
		var results = require('./../../utils/results.js');
		res.send(data);
		res.end();
	});
	return app;
};

