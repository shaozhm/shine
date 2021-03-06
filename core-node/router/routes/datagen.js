/*eslint-env node, es6*/
/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, quotes: 0, no-use-before-define: 0, new-cap:0, no-undef:0 */
module.exports = function() {
	//var DataGeneratorDB = require('./DataGeneratorDBPromises');
	var express = require('express');
	var winston = require('winston');
	var util = require('./util');
	var logging = require('@sap/logging');
	var appContext = logging.createAppContext();
	var logger;
	var bodyParser = require('body-parser');
	var jsonParser = bodyParser.json();
	var xsenv = require('@sap/xsenv');
	xsenv.loadEnv();
	var credentials = xsenv.getServices({
		auditlog: 'shine-auditlog'
	}).auditlog;
	var auditLog = require('@sap/audit-logging')(credentials);
	var app = express.Router();
	winston.level = process.env.winston_level || 'error';
	//Generate time based Data
	app.post('/timebasedPO', jsonParser, (req, res) => {
		//var reqContext = appContext.createRequestContext(req);
		logger = req.loggingContext.getLogger('/replicate/timebasedPO');
		logger.info('Time based Sales Data generation initiated');
		var totalRecords = encodeURI((req.body.noRec)) * 1000;
		var id = req.body.id;
		//var query;
		var procedure;
		var inputParams;

		function convertDate(d) {
			console.log("inside func");
			var parts = d.split(" ");
			var months = {
				Jan: "01",
				Feb: "02",
				Mar: "03",
				Apr: "04",
				May: "05",
				Jun: "06",
				Jul: "07",
				Aug: "08",
				Sep: "09",
				Oct: "10",
				Nov: "11",
				Dec: "12"
			};

			return parts[2] + "." + months[parts[1]] + "." + parts[3];
		}
		var aStartDate = req.body.startdate;
		aStartDate = convertDate(aStartDate);
		var aStr = aStartDate.replace(/%20/g, ' ');
		var aEndDate = req.body.enddate;
		aEndDate = convertDate(aEndDate);
		if (id === 'PurchaseOrderId') {
			//query = "CALL \"load_data_PO\"(START_DATE => '" + aStartDate + "',END_DATE => '" + aEndDate + "',ANOREC => " + totalRecords +
			//	",RES => ?)";
			procedure = "load_data_PO";
			inputParams = {
				"START_DATE":aStartDate,
				"END_DATE": aEndDate,
				"ANOREC": totalRecords
			}
		} else {
			//query = "CALL \"load_data_SO\"(START_DATE => '" + aStartDate + "',END_DATE => '" + aEndDate + "',ANOREC => " + totalRecords +
				//",RES => ?)";
			procedure = "load_data_SO";
			inputParams = {
				"START_DATE":aStartDate,
				"END_DATE": aEndDate,
				"ANOREC": totalRecords
			}
		}
		
		/*var dg = new DataGeneratorDB(req);
		dg.executeQuery(query)
			.then((status) => {
				if (id === 'PurchaseOrderId') {
					res.json({
						status: 200,
						message: 'Purchase orders generated successfully, records added: ' + totalRecords
					});
				} else {
					res.json({
						status: 200,
						message: 'Sales orders generated successfully, records added: ' + totalRecords
					});
				}
			})
			.then(() => {
				dg.closeDB();
			})
			.catch((error) => {
				dg.closeDB();
				res.json({
					status: 401,
					message: 'ERR',
					data: err
				});
			});*/
		
		const dbClass = require(global.__base + "utils/dbPromises");
		let db = new dbClass(req.db);
		let hdbext = require("@sap/hdbext");
		
		db.loadProcedurePromisified(hdbext, null, procedure)
		.then(sp => {
			db.callProcedurePromisified(sp,inputParams)
			.then(({parameters,results}) => {
				if (id === 'PurchaseOrderId') {
					res.json({
						status: 200,
						message: 'Purchase orders generated successfully, records added: ' + totalRecords
					});
				} else {
					res.json({
						status: 200,
						message: 'Sales orders generated successfully, records added: ' + totalRecords
					});
				}
			})
			.catch((error) => {
				res.json({
					status: 500,
					message: 'ERR while calling procedure',
					data: error
				});
			})
		})
		.catch((error) => {
			res.json({
				status: 500,
				message: 'ERR while loading procedure',
				data: error
			});
		})
		
	});

	// method will pick records from SOShadow.Header and add to SO.Header
	// and SOShadow.Item to SO.Item
	app.post('/sales', (req, res) => {
		var usrName = req.user.id;
		var client = req.db;
		//var reqContext = appContext.createRequestContext(req);
		logger = req.loggingContext.getLogger('/replicate/sales');
		logger.info('Sales Data generation initiated');
		var msg = auditLog.update('Sales order generation initialted ').attribute('Data generation initiation', true).by(usrName);
		msg.log(function(err, id) {
			// Place all of the remaining logic here
			if (err) {
				logger.info('ERROR: ' + err.toString());
			}
			logger.info('Log Entry Saved as: ' + id);
		});
		var origTable = 'SO.Header';
		util.getTableInfo(client, origTable, origTable, (error, response) => {
			var tableSize = response[0].RECORD_COUNT;
			logger.info('Table size:' + tableSize);
			var usrName = req.user.id;
			var query = 'insert into "SO.Header" ' + 'SELECT TOP 1000 ' + "(\"SALESORDERID\" + " + tableSize + ') AS "SALESORDERID",' +
				' "HISTORY.CREATEDBY.EMPLOYEEID",	"HISTORY.CREATEDAT",' + ' "HISTORY.CHANGEDBY.EMPLOYEEID",	"HISTORY.CHANGEDAT",' +
				' "NOTEID", "PARTNER.PARTNERID",	"CURRENCY",	"GROSSAMOUNT",' + '	"NETAMOUNT", "TAXAMOUNT", "LIFECYCLESTATUS", "BILLINGSTATUS",' +
				'	"DELIVERYSTATUS" FROM "shadow::SOShadow.Header"';

				
			const dbClass = require(global.__base + "utils/dbPromises");
			let db = new dbClass(req.db);
			db.preparePromisified(query)
			.then(statement => {
				db.statementExecPromisified(statement,[])
				.then(results => {
					logger.info('SO header query executed successfully');
					var salesOrdersAdded = results;
					var query = 'insert into "SO.Item" ' + 'SELECT ' + "(\"SALESORDERID\" + " + tableSize + ') AS "SALESORDERID",' +
						' "SALESORDERITEM", "PRODUCT.PRODUCTID", "NOTEID",' + ' "CURRENCY", "GROSSAMOUNT", "NETAMOUNT", "TAXAMOUNT",' +
						' "ITEMATPSTATUS", "OPITEMPOS", "QUANTITY", "QUANTITYUNIT",' + ' "DELIVERYDATE" FROM "shadow::SOShadow.Item"' +
						' WHERE "SALESORDERID" < 500001000';
					db.preparePromisified(query)
					.then(statement => {
						db.statementExecPromisified(statement,[])
						.then(results => {
							logger.info('SO Item query executed successfully');
							msg = auditLog.update('Sales order generation successful')
								.attribute('Data generation of 1000 records', true)
								.by(usrName);
							msg.log(function(err, id) {
								// Place all of the remaining logic here
								if (err) {
									logger.info('ERROR: ' + err.toString());
								}
								logger.info('Log Entry Saved as: ' + id);
							});
						})
						.then(() =>{
							util.callback(error, response, res,
								'Sales orders replicated successfully, records added: ' + salesOrdersAdded);
						})
						.catch((error) => {
							dg.closeDB();
							logger.error('SO Item Query execution error: ' + error);
							msg = auditLog.update('Purchase order generation failed')
								.attribute('Data generation', false)
								.by(usrName);
							msg.log(function(err, id) {
								if (err) {
									res.type("text/plain").status(500).send("ERROR: " + err.toString());
									return;
								}
								res.type("application/json").status(200).send(JSON.stringify('Log Entry Saved as: ' + id));
							});

						})
					})
					
				})
				.catch((error) => {
					logger.error('SO header Query execution error: ' + error);
					util.callback(error, response, res, "");

				})
			})
			
			
			
			/*var dg = new DataGeneratorDB(req);
			dg.executeQuery(query)
				.then((response) => {
					logger.info('SO header query executed successfully');
					var salesOrdersAdded = response;
					var query = 'insert into "SO.Item" ' + 'SELECT ' + "(\"SALESORDERID\" + " + tableSize + ') AS "SALESORDERID",' +
						' "SALESORDERITEM", "PRODUCT.PRODUCTID", "NOTEID",' + ' "CURRENCY", "GROSSAMOUNT", "NETAMOUNT", "TAXAMOUNT",' +
						' "ITEMATPSTATUS", "OPITEMPOS", "QUANTITY", "QUANTITYUNIT",' + ' "DELIVERYDATE" FROM "shadow::SOShadow.Item"' +
						' WHERE "SALESORDERID" < 500001000';
					dg.executeQuery(query)
						.then((status) => {
							logger.info('SO Item query executed successfully');
							msg = auditLog.update('Sales order generation successful')
								.attribute('Data generation of 1000 records', true)
								.by(usrName);
							msg.log(function(err, id) {
								// Place all of the remaining logic here
								if (err) {
									logger.info('ERROR: ' + err.toString());
								}
								logger.info('Log Entry Saved as: ' + id);
							});
						})
						.then(() => {
							util.callback(error, response, res,
								'Sales orders replicated successfully, records added: ' + salesOrdersAdded);
							dg.closeDB();
						})
						.catch((error) => {
							dg.closeDB();
							logger.error('SO Item Query execution error: ' + error);
							msg = auditLog.update('Purchase order generation successful')
								.attribute('Data generation', false)
								.by(usrName);
							msg.log(function(err, id) {
								if (err) {
									res.type("text/plain").status(500).send("ERROR: " + err.toString());
									return;
								}
								res.type("application/json").status(200).send(JSON.stringify('Log Entry Saved as: ' + id));
							});
						})
						.then(() => {
							dg.closeDB();
						})
						.catch((error) => {
							dg.closeDB();
							logger.error('SO header Query execution error: ' + error);
							util.callback(error, response, res, "");
						});
				});*/

		});
	});

	// method will pick records from POShadow.Header and add to PO.Header
	// and POShadow.Item to PO.Item
	app.post('/purchase', (req, res) => {
		//var reqContext = appContext.createRequestContext(req);
		var usrName = req.user.id;
		logger = req.loggingContext.getLogger('/replicate/purchase');
		logger.info('Purchase Data generation initiated');
		var msg = auditLog.update('Purchase order generation initiated ')
			.attribute('Data generation initiation', true)
			.by(usrName);
		msg.log(function(err, id) {
			if (err) {
				logger.info('ERROR: ' + err.toString());
			}
			logger.info('Log Entry Saved as: ' + id);
		});
		var client = req.db;
		var origTable = 'PO.Header';
		util.getTableInfo(client, origTable, origTable, (error, response) => {
			var tableSize = response[0].RECORD_COUNT;
			logger.info('Table size:' + tableSize);
			var query = 'insert into "PO.Header" ' + 'SELECT ' + "(\"PURCHASEORDERID\" + " + tableSize + ') AS "PURCHASEORDERID",' +
				' "HISTORY.CREATEDBY.EMPLOYEEID",	"HISTORY.CREATEDAT",' + ' "HISTORY.CHANGEDBY.EMPLOYEEID",	"HISTORY.CHANGEDAT",' +
				' "NOTEID", "PARTNER.PARTNERID",	"CURRENCY",	"GROSSAMOUNT",' + '	"NETAMOUNT", "TAXAMOUNT", "LIFECYCLESTATUS", "APPROVALSTATUS",' +
				' "CONFIRMSTATUS", "ORDERINGSTATUS",' + '	"INVOICINGSTATUS" FROM "shadow::POShadow.Header"';
			
			const dbClass = require(global.__base + "utils/dbPromises");
			let db = new dbClass(req.db);
			
			db.preparePromisified(query)
			.then(statement => {
				db.statementExecPromisified(statement,[])
				.then(results => {
					logger.info('PO header Query execution successful');
					var purchaseOrdersAdded = results;
					var query = 'insert into "PO.Item" ' + 'SELECT ' + "(\"PURCHASEORDERID\" + " + tableSize + ') AS "PURCHASEORDERID",' +
					' "PURCHASEORDERITEM", "PRODUCT.PRODUCTID", "NOTEID",' + ' "CURRENCY", "GROSSAMOUNT", "NETAMOUNT", "TAXAMOUNT",' +
					' "QUANTITY", "QUANTITYUNIT",' + ' "DELIVERYDATE" FROM "shadow::POShadow.Item"';
					
					db.preparePromisified(query)
					.then(statement => {
						db.statementExecPromisified(statement,[])
						.then(results => {
							logger.info('PO Item query executed successfully');
							msg = auditLog.update('Purchase order generation successful')
							.attribute('Data generation 1000 records', true)
							.by(usrName);
							msg.log(function(err, id) {
								if (err) {
									logger.info('ERROR: ' + err.toString());
								}
								logger.info('Log Entry Saved as: ' + id);
							});
						})
						.then(() => {
							util.callback(error, response, res,
									'Purchase orders replicated successfully, records added: ' + purchaseOrdersAdded);
						})
						.catch((error) => {
							logger.error('PO Item Query execution error: ' + error);
							msg = auditLog.update('Purchase order generation successful')
								.attribute('Data generation', false)
								.by(usrName);
							msg.log(function(err, id) {
								if (err) {
									logger.info('ERROR: ' + err.toString());
								}
								logger.info('Log Entry Saved as: ' + id);
							});
						});
					})
				
				})
				.catch((error) => {
					logger.error('PO header Query execution error: ' + error);
					util.callback(error, response, res, "");
				})
			});
			/*			
			var dg = new DataGeneratorDB(req);
			
			dg.executeQuery(query)
			.then((response) => {
				logger.info('PO header Query execution successful');
				var purchaseOrdersAdded = response;
				var query = 'insert into "PO.Item" ' + 'SELECT ' + "(\"PURCHASEORDERID\" + " + tableSize + ') AS "PURCHASEORDERID",' +
					' "PURCHASEORDERITEM", "PRODUCT.PRODUCTID", "NOTEID",' + ' "CURRENCY", "GROSSAMOUNT", "NETAMOUNT", "TAXAMOUNT",' +
					' "QUANTITY", "QUANTITYUNIT",' + ' "DELIVERYDATE" FROM "shadow::POShadow.Item"';
				
				dg.executeQuery(query)
				.then((response) => {
					logger.info('PO Item query executed successfully');
					msg = auditLog.update('Purchase order generation successful')
						.attribute('Data generation 1000 records', true)
						.by(usrName);
					msg.log(function(err, id) {
						if (err) {
							logger.info('ERROR: ' + err.toString());
						}
						logger.info('Log Entry Saved as: ' + id);
					});
				})
				.then(() => {
					util.callback(error, response, res,
							'Purchase orders replicated successfully, records added: ' + purchaseOrdersAdded);
					dg.closeDB();
				})
				.catch((error) => {
					dg.closeDB();
					logger.error('PO Item Query execution error: ' + error);
					msg = auditLog.update('Purchase order generation successful')
						.attribute('Data generation', false)
						.by(usrName);
					msg.log(function(err, id) {
						if (err) {
							logger.info('ERROR: ' + err.toString());
						}
						logger.info('Log Entry Saved as: ' + id);
					});
				});
			})
			.then(() => {
				dg.closeDB();
			})
			.catch((error) => {
				dg.closeDB();
				logger.error('PO header Query execution error: ' + error);
				util.callback(error, response, res, "");
			});*/
		});
	});
	return app;
};
