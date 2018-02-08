/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, new-cap: 0*/
"use strict";
var express = require("express");
var path    = require("path");
var fs		= require("fs");

module.exports = function() {
	var app = express.Router();

	//Hello Router
	app.get("/", function(req, res) {
	var results = require('./../../utils/results.js');
		res.send(results.test);
        res.end();
	});
	return app;
};

