/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, quotes: 0, no-use-before-define: 0, new-cap:0, linebreak-style: ["error", "windows"], no-undef:0*/
/*eslint-env node, es6*/
'use strict';
var express = require('express');
var JobSchedulerDB = require('./JobSchedulerDBPromises');

module.exports = function() {
	var app = express.Router();

	var winston = require('winston');
	var util = require(global.__base + "utils/util");

	var logger;

	winston.level = process.env.winston_level || 'error';
	

	// method will delete all job data
	app.delete('/deleteData', (req, res) => {
		logger = req.loggingContext.getLogger('/jobs/deleteData');
		
		var js = new JobSchedulerDB(req);

		js.deleteTriggeredJobsData()
		.then(() => {
			res.writeHead(200, {
				'Content-Type': 'application/json'
			});
			res.end(JSON.stringify({'message': 'All records in Jobs Data table deleted'}));
		})
		.then(() => {
			js.closeDB();
		})
		.catch((err) => {
			logger.error('Error occured' + err);
			js.closeDB();
			util.callback(err, res, "");	
		});
	});
	
	//method will get all jobs count
	app.get('/getJobsCount', (req, res) => {
		logger = req.loggingContext.getLogger('/jobs/getJobsCount');
		var jobArray = [];
		var jobObj = {};
		var jsonString = '{"d":'+'{"icon": "sap-icon://time-entry-request","info":" ",';
		var jsonString3 = '"numberDigits": 1,"subtitle": "No of Jobs"}}';
		
		var js =  new JobSchedulerDB(req);
		
		js.getJobsCount()
		.then((rows) => {
			logger.info("rows"+Object.keys(rows));
			if(rows.length >= 1){
				logger.info("rows[0] "+rows[0]);
				var count =  rows[0].COUNT;
				logger.info("rowsLength"+rows.length);
				logger.info("count"+count);
				var numberStateString = '"numberState": "Positive",';
				if(count > 0){
					numberStateString = '"numberState": "Positive",';
				}else{
					numberStateString = '"numberState": "Negative",';
				}
				var jsonString2 = '"number":'+count+','+numberStateString;
				var responseString = jsonString+jsonString2+jsonString3;
				logger.info("response string"+responseString);
				var response = JSON.parse(responseString);
				logger.info("Response "+response);
				res.writeHead(200, {
					"Content-Type": "application/json"
				});
				res.end(JSON.stringify(response));
			}
		})
		.then(() => {
			js.closeDB();
		})
		.catch((err) => {
			js.closeDB();
			logger.error('Error occured' + err);
			util.callback(err, res, 'Data Unavailable');
		});
	});

	//method will get all jobs data
	app.get('/getAllJobs', (req, res) => {
		logger = req.loggingContext.getLogger("/jobs/getAllJobs");
		var jobArray = [];
		var jobObj = {};
		
		var js = new JobSchedulerDB(req);
		
		js.getAllJobs()
		.then((rows) => {
				for (var i in rows) {
					jobObj = {
						"Id": rows[i].ID,
						"Name": rows[i].NAME,
						"TimeStamp": rows[i].TIMESTAMP
					};
					jobArray.push(jobObj);
				}
				res.writeHead(200, {
					"Content-Type": "application/json"
				});
				res.end(JSON.stringify(jobArray));
		})
		.then((rows) => {
			js.closeDB();
		})
		.catch((err) => {
			logger.error('Error occured' + err);
			js.closeDB();
			util.callback(err, res, "Job fetching failed");	
		});
		
	});

	//method will get jobs by name 
	app.get('/getJobsByName/:name', (req, res) => {
		logger = req.loggingContext.getLogger("/jobs/getJobsByName");
		var name = req.params.name;
		var jobArray = [];
		var jobObj = {};
		
		var js = new JobSchedulerDB(req);
		
		var params = [name];
		js.getJobsByName(params)
		.then((rows) => {
			for (var i in rows) {
				jobObj = {
					"Id": rows[i].ID,
					"Name": rows[i].NAME,
					"TimeStamp": rows[i].TIMESTAMP
				};
				jobArray.push(jobObj);
			}
			res.writeHead(200, {
				"Content-Type": "application/json"
			});
			res.end(JSON.stringify(jobArray));				
		})
		.then(() => {
			js.closeDB();
		})
		.catch((err) => {
			js.closeDB();
			logger.error('Error occured' + err);
			util.callback(err, res, "Job fetching failed");
		});
		
	});
	return app;
};
