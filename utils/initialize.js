/*eslint no-console: 0, no-unused-vars: 0*/
"use strict";
module.exports = {
	
	runTest: function() {	
			var request = require ("request");
			var xsenv = require("@sap/xsenv");
			var config = require('./config.js');
			var util = require("./util");
		
			var Mocha = require('mocha'),
				   fs = require('fs'),
				 path = require('path'),
			  results = require('./results.js');
		
			
			var xsuaa = xsenv.getServices({uaa: {tag: "xsuaa"}}).uaa;
			//xsenv.getDestination
			var clientid = xsuaa.clientid;
			var clientsecret = xsuaa.clientsecret;
			var url = xsuaa.url;
			var host = url.split(":3")[0];
		
			//Getting app ports
			var data = util.getFullApplicationPort();
			var coreXsjsURL = data.coreXsjsURL;
			var userXsjsURL = data.userXsjsURL;
			var coreNodeURL = data.coreNodeURL;
		
			config.set_core_node(coreNodeURL);
			config.set_core_xsjs(coreXsjsURL);
			config.set_user_xsjs(userXsjsURL);
			
			var auth = "Basic " + new Buffer(clientid + ":" + clientsecret).toString("base64");
			
			var options = {  
			    url: url+"/oauth/token",
			   
			    headers: {
			        'Authorization': auth,
			        'content-type': 'application/x-www-form-urlencoded'
			        
			    },
			    form: {
				    client_id: clientid,
				    grant_type: 'client_credentials' 
			    }
			};
		
			request.post(options,function(err, res, body) {  
			    var result=JSON.parse(body.toString());
			   
			    var access_token= result.access_token;
			    
			    config.set_jwt(access_token);
			    console.log("config.jwt : "+config.jwt);
			    console.log("config.core_xsjs : "+config.core_xsjs);
			    console.log("config.user_xsjs : "+config.user_xsjs);
			    console.log("config.user_node : "+config.core_node);
				
				
				
				
		  	});

	}
};

