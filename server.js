/*eslint no-console: 0, no-unused-vars: 0, no-undef:0*/
/*eslint-env node, es6 */

'use strict';
var https = require('https');
var port = process.env.PORT || 3000;
var xsenv = require('@sap/xsenv');
var server = require('http').createServer();
https.globalAgent.options.ca = xsenv.loadCertificates();
global.__base = __dirname + '/';

//Initialize Express App for XSA UAA and HDBEXT Middleware
var xssec = require('@sap/xssec');
var xsHDBConn = require('@sap/hdbext');
var express = require('express');

//logging
var logging = require('@sap/logging');
var appContext = logging.createAppContext();

//Initialize Express App for XS UAA and HDBEXT Middleware
var app = express();
app.use(logging.expressMiddleware(appContext));



//Setup Routes
var router = require('./router')(app, server);

global.__base = __dirname + "/";
var init = require(global.__base + "utils/initialize");
init.runTest();

//Start the Server
server.on('request', app);
server.listen(port, function() {
	console.info("HTTP Server: " + server.address().port);
});
