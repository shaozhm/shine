/*eslint no-console: 0*/
"use strict";
var https= require('https');
var express = require('express');
var passport = require('passport');
var xssec = require('@sap/xssec');
var routes = require('./routes/index');
var hdbext = require('@sap/hdbext');
var bodyParser = require('body-parser');
var logging = require('@sap/logging');
var xsenv = require('@sap/xsenv');
var appContext = logging.createAppContext();
var app = express();
var PORT = process.env.PORT || 3000;

https.globalAgent.options.ca= xsenv.loadCertificates(); 
var hanaOptions = xsenv.getServices({ hana: { tag: 'hana' } });
console.log('hanaoptions',hanaOptions);
passport.use('JWT', new xssec.JWTStrategy(xsenv.getServices({uaa:{tag:'xsuaa'}}).uaa));
app.use(logging.middleware({ appContext: appContext, logNetwork: true }));

app.use(bodyParser.json());
//use passport for authentication
app.use(passport.initialize());
app.use('/',hdbext.middleware(hanaOptions.hana),
           passport.authenticate('JWT', {session: false}),
           routes.jobs,
           routes.schedules,
           routes.jobactivity);
//start the HTTP server
app.listen(PORT, function () {
    console.log('Server running on http://localhost:' + PORT);
});
