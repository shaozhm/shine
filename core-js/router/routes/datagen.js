module.exports = function() {
	var express = require("express");
	var async = require('async');
	var cds = require('@sap/cds');
	var winston = require('winston');
	//var util = require(global.__base + "utils/datagen");
	var util = require("./util");
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
	console.log("credentials" + credentials.user);

	var app = express.Router();
	winston.level = process.env.winston_level || 'error';
	// method will pick records from SOShadow.Header and add to SO.Header
	// and SOShadow.Item and add to SO.Item

	
	app.post('/timebasedPO', jsonParser, function(req, res) {

		var client = req.db;
		var reqContext = appContext.createRequestContext(req);
		logger = reqContext.getLogger("/replicate/timebasedPO");
		logger.info(' Time based Sales Data generation initiated');
		console.log("Time based purchase Data generation initiated" + "+++++++++" + req.body.id);
	    
		var totalRecords = encodeURI((req.body.noRec)) * 1000;
		var id = req.body.id;
		var usrName = req.user.id;
		var query;
		var aStartDate = encodeURI(req.body.startdate);
		var aStr  = aStartDate.replace(/%20/g, " ");
		
    	var t = new Date(aStr);
    	aStartDate = t.getDate()+'.'+t.getMonth()+'.'+t.getFullYear();
    	var d = t.getFullYear();
		var aEndDate = encodeURI(req.body.enddate);
		var aEnd = aEndDate.replace(/%20/g, " ");
		var d = new Date(aEnd);
		aEndDate =  d.getDate()+'.'+d.getMonth()+'.'+d.getFullYear();
		if(id === "PurchaseOrderId") 
		{
			 query = "CALL \"load_data_PO\"(START_DATE => '"+aStartDate+"',END_DATE => '"+aEndDate+"',ANOREC => "+totalRecords+",RES => ?)";
			
		}
		else
		{
			 query = "CALL \"load_data_SO\"(START_DATE => '"+aStartDate+"',END_DATE => '"+aEndDate+"',ANOREC => "+totalRecords+",RES => ?)";
		}
	console.log("query----->"+query);
    
			client.exec(query, function(err, dummy) {
					  if (err) {

                                res.json({status: 401, message: "ERR", data: err});

                            }
				else {

                               
									if(id === "PurchaseOrderId") 
									{
                                res.json({status: 200, message: "Purchase orders generated successfully, records added: " + totalRecords});
									}
									else
									{
									res.json({status: 200, message: "Sales orders generated successfully, records added: " + totalRecords});	
									}

                            }
			});
	});

	app.post('/sales', function(req, res) {
		var user = req.user;
		var usrName = req.user.id;
		var reqContext = appContext.createRequestContext(req);
		logger = reqContext.getLogger("/replicate/sales");
		logger.info('Sales Data generation initiated');
		var msg = auditLog.update('Sales order generation initialted ')
			.attribute('Data generation initiation', true)
			.by(usrName);

		console.log("msg----->" + Object.keys(msg));
		msg.log(function(err, id) {
			if (err) {
				console.log("error" + err);
			} else {
				console.log("success" + id);
			}

		});
		var client = req.db;
		var origTable = "SO.Header";
		util.getTableInfo(client, origTable, origTable, function(error, response) {
			var tableSize = response[0].RECORD_COUNT;
			logger.info('Table size:' + tableSize);
			var usrName = req.user.id;
			var query = 'insert into "SO.Header" ' + 'SELECT TOP 1000 ' + "(\"SALESORDERID\" + " + tableSize + ') AS "SALESORDERID",' +
				' "HISTORY.CREATEDBY.EMPLOYEEID",	"HISTORY.CREATEDAT",' + ' "HISTORY.CHANGEDBY.EMPLOYEEID",	"HISTORY.CHANGEDAT",' +
				' "NOTEID", "PARTNER.PARTNERID",	"CURRENCY",	"GROSSAMOUNT",' + '	"NETAMOUNT", "TAXAMOUNT", "LIFECYCLESTATUS", "BILLINGSTATUS",' +
				'	"DELIVERYSTATUS" FROM "shadow::SOShadow.Header"';
			client.exec(query, function(error, response) {
				if (error) {
					logger.error("SO header Query execution error: " + error);
					util.callback(error, response, res, "");
				} else {
					logger.info('SO header query executed successfully');
					var salesOrdersAdded = response;
					var query = 'insert into "SO.Item" ' + 'SELECT ' + "(\"SALESORDERID\" + " + tableSize + ') AS "SALESORDERID",' +
						' "SALESORDERITEM", "PRODUCT.PRODUCTID", "NOTEID",' + ' "CURRENCY", "GROSSAMOUNT", "NETAMOUNT", "TAXAMOUNT",' +
						' "ITEMATPSTATUS", "OPITEMPOS", "QUANTITY", "QUANTITYUNIT",' + ' "DELIVERYDATE" FROM "shadow::SOShadow.Item"' +
						' WHERE "SALESORDERID" < 500001000';
					client.exec(query, function(error, response) {
						if (error) {
							logger.error("SO Item Query execution error: " + error);
							msg = auditLog.update('Purchase order generation successful')
								.attribute('Data generation', false)
								.by(usrName);
							msg.log(function(err, id) {
								if (err) {
									console.log("error" + err);
								} else {
									console.log("success" + id);
								}

							});
						} else {
							logger.info('SO Item query executed successfully');
							msg = auditLog.update('Sales order generation successful')
								.attribute('Data generation of 1000 records', true)
								.by(usrName);
							msg.log(function(err, id) {
								if (err) {
									console.log("error" + err);
								} else {
									console.log("success" + id);
								}

							});
						}

						util.callback(error, response, res,
							"Sales orders replicated successfully, records added: " + salesOrdersAdded);
					});
				}
			});
		});
	});

	// method will pick records from POShadow.Header and add to PO.Header
	// and POShadow.Item to PO.Item
	app.post('/purchase', function(req, res) {
		var reqContext = appContext.createRequestContext(req);
		var usrName = req.user.id;
		logger = reqContext.getLogger("/replicate/purchase");
		logger.info('Purchase Data generation initiated');
		var msg = auditLog.update('Purchase order generation initiated ')
			.attribute('Data generation initiation', true)
			.by(usrName);

		console.log("msg----->" + Object.keys(msg));
		msg.log(function(err, id) {
			if (err) {
				console.log("error" + err);
			} else {
				console.log("success" + id);
			}
		});
		var client = req.db;
		var origTable = "PO.Header";
		util.getTableInfo(client, origTable, origTable, function(error, response) {
			var tableSize = response[0].RECORD_COUNT;
			var user = req.user;
			logger.info('Table size:' + tableSize);
			var query = 'insert into "PO.Header" ' + 'SELECT ' + "(\"PURCHASEORDERID\" + " + tableSize + ') AS "PURCHASEORDERID",' +
				' "HISTORY.CREATEDBY.EMPLOYEEID",	"HISTORY.CREATEDAT",' + ' "HISTORY.CHANGEDBY.EMPLOYEEID",	"HISTORY.CHANGEDAT",' +
				' "NOTEID", "PARTNER.PARTNERID",	"CURRENCY",	"GROSSAMOUNT",' + '	"NETAMOUNT", "TAXAMOUNT", "LIFECYCLESTATUS", "APPROVALSTATUS",' +
				' "CONFIRMSTATUS", "ORDERINGSTATUS",' + '	"INVOICINGSTATUS" FROM "shadow::POShadow.Header"';
			client.exec(query, function(error, response) {
				if (error) {
					logger.error("PO header Query execution error: " + error);
					util.callback(error, response, res, "");
				} else {
					logger.info("PO header Query execution successful");
					var purchaseOrdersAdded = response;
					var query = 'insert into "PO.Item" ' + 'SELECT ' + "(\"PURCHASEORDERID\" + " + tableSize + ') AS "PURCHASEORDERID",' +
						' "PURCHASEORDERITEM", "PRODUCT.PRODUCTID", "NOTEID",' + ' "CURRENCY", "GROSSAMOUNT", "NETAMOUNT", "TAXAMOUNT",' +
						' "QUANTITY", "QUANTITYUNIT",' + ' "DELIVERYDATE" FROM "shadow::POShadow.Item"';
					client.exec(query, function(error, response) {
						if (error) {
							logger.error("PO Item Query execution error: " + error);
							msg = auditLog.update('Purchase order generation successful')
								.attribute('Data generation', false)
								.by(usrName);
							msg.log(function(err, id) {
								if (err) {
									console.log("error" + err);
								} else {
									console.log("success" + id);
								}

							});
						} else {
							logger.info('PO Item query executed successfully');
							msg = auditLog.update('Purchase order generation successful')
								.attribute('Data generation 1000 records', true)
								.by(usrName);
							msg.log(function(err, id) {
								if (err) {
									console.log("error" + err);
								} else {
									console.log("success" + id);
								}

							});
						}
						util.callback(error, response, res,
							"Purchase orders replicated successfully, records added: " + purchaseOrdersAdded);
					});
				}
			});
		});
	});
	return app;
};
