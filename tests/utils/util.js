/*eslint no-console: 0, no-unused-vars: 0*/
"use strict";
module.exports = {
	getFullApplicationPort: function() {	
		//parsing VCAP services
		var testUrl,testPort,coreNodePort,coreXsjsPort,userXsjsPort;
		var data;
		if(process.env.VCAP_APPLICATION){
			 var env = JSON.parse(process.env.VCAP_APPLICATION);
			 testUrl = env.full_application_uris[0];
			 testPort = testUrl.split(':')[2];
			 
			 coreXsjsPort = testPort - 3;
			 userXsjsPort = testPort - 2;
			 coreNodePort = testPort - 1;
			 
			 data = {
			 	"coreXsjsPort": coreXsjsPort,
			 	"userXsjsPort": userXsjsPort,
			 	"coreNodePort": coreNodePort
			 };
			 
		}
		return data;
	}
};
