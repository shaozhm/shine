/*eslint no-console: 0, no-unused-vars: 0*/
"use strict";
var shine = require('../shine.json');
var fs = require('fs');
module.exports = {
	getFullApplicationPort: function() {	
		//parsing VCAP services
		var coreNodeURL,coreXsjsURL,userXsjsURL;
		var data;
		
			 coreXsjsURL = shine.core_xsjs_url;
			 userXsjsURL = shine.user_xsjs_url;
			 coreNodeURL = shine.core_node_url;
			 
			 data = {
			 	"coreXsjsURL": coreXsjsURL,
			 	"userXsjsURL": userXsjsURL,
			 	"coreNodeURL": coreNodeURL
			 };
			 
		
		return data;
	}
};
