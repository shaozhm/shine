'use strict';
var https = require('https');
var xsjs = require('@sap/xsjs');
var xsenv = require('sap-xsenv');
var port = process.env.PORT || 3000;
https.globalAgent.options.ca= xsenv.loadCertificates(); 

var options = {
	anonymous : false, // remove to authenticate calls
	redirectUrl : "/index.xsjs"
};

// configure HANA
options = Object.assign(options, xsenv.getServices({ hana: {tag: "hana"} }));

// configure UAA
options = Object.assign(options, xsenv.getServices({  uaa:{name:process.env.UAA_SERVICE_NAME} }));

// start server
xsjs(options).listen(port);

console.log("Server listening on port %d", port);
