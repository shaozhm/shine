/*eslint no-console: 0, no-unused-vars: 0, no-shadow: 0, quotes: 0, no-use-before-define: 0, new-cap:0, no-undef:0 */
'use strict';
module.exports = function() {
var express = require('express');
var async = require('async');
var cds = require('@sap/cds');
//var router = express.Router();
var winston = require('winston');
//var util = require(global.__base + "utils/datagen");
var util = require('./util');
var logging = require('@sap/logging');
var appContext = logging.createAppContext();
var logger;
var app = express.Router();
winston.level = process.env.winston_level || 'error';
app.post('/soheader', function (req, res) {
	var reqContext = appContext.createRequestContext(req);
	logger = reqContext.getLogger("/reset/soheader");
	logger.info('reset so header triggered');
    //console.log('reset so header triggered');
    util.resetTable(
        req,
		res,
        'SO.Header',
		'SOShadow.Header',
        util.callback
    );
});

app.post('/soitem', function (req, res) {
	var reqContext = appContext.createRequestContext(req);
	logger = reqContext.getLogger("/reset/soitem");
    logger.info('reset so item triggered');
    //console.log('reset so item triggered');
    util.resetTable(
        req,
		res,
        'SO.Item',
		'SOShadow.Item',
        util.callback
    );
});

app.post('/poheader', function (req, res) {
	var reqContext = appContext.createRequestContext(req);
	logger = reqContext.getLogger("/reset/poheader");
    logger.info('reset po header triggered');
    //console.log('reset po header triggered');
    util.resetTable(
        req,
		res,
        'PO.Header',
		'POShadow.Header',
        util.callback
    );
});

app.post('/poitem', function (req, res) {
	var reqContext = appContext.createRequestContext(req);
	logger = reqContext.getLogger("/reset/poitem");
    logger.info('reset po item triggered');
    //console.log('reset po item triggered');
    util.resetTable(
        req,
		res,
        'PO.Item',
		'POShadow.Item',
        util.callback
    );
});

app.post('/addresses', function (req, res) {
	var reqContext = appContext.createRequestContext(req);
	logger = reqContext.getLogger("/reset/addresses");
    logger.info('reset addresses triggered');
    //console.log('reset addresses triggered');
    util.resetTable(
        req,
		res,
        'MD.Addresses',
		'MDShadow.Addresses',
        util.callback
    );
});

app.post('/partners', function (req, res) {
	var reqContext = appContext.createRequestContext(req);
	logger = reqContext.getLogger("/reset/partners");
    logger.info('reset business partners triggered');
    //console.log('reset business partners triggered');
    util.resetTable(
        req,
		res,
        'MD.BusinessPartner',
		'MDShadow.BusinessPartner',
        util.callback
    );
});

app.post('/employees', function (req, res) {
	var reqContext = appContext.createRequestContext(req);
    logger = reqContext.getLogger("/reset/employees");
    logger.info('reset employees triggered');
    //console.log('reset employees triggered');
    util.resetTable(
        req,
		res,
        'MD.Employees',
		'MDShadow.Employees',
        util.callback
    );
});

app.post('/products', function (req, res) {
	var reqContext = appContext.createRequestContext(req);
	logger = reqContext.getLogger("/reset/products");
    logger.info('reset products triggered');
    //console.log('reset products triggered');
    util.resetTable(
        req,
		res,
        'MD.Products',
		'MDShadow.Products',
        util.callback
    );
});

app.post('/constants', function (req, res) {
	var reqContext = appContext.createRequestContext(req);
    logger = reqContext.getLogger("/reset/constants");
    logger.info('reset constants triggered');
    //console.log('reset constants triggered');
    util.resetTable(
        req,
		res,
        'Util.Constants',
		'UtilShadow.Constants',
        util.callback
    );
});

app.post('/texts', function (req, res) {
	var reqContext = appContext.createRequestContext(req);
	logger = reqContext.getLogger("/reset/texts");
    logger.info('reset texts triggered');
    //console.log('reset texts triggered');
    util.resetTable(
        req,
		res,
        'Util.Texts',
		'UtilShadow.Texts',
        util.callback
    );
});

app.post('/notes', function (req, res) {
	var reqContext = appContext.createRequestContext(req);
    logger = reqContext.getLogger("/reset/notes");
    logger.info('reset notes triggered');
    //console.log('reset notes triggered');
    util.resetTable(
        req,
		res,
        'Util.Notes',
		'UtilShadow.Notes',
        util.callback
    );
});

app.post('/attachments', function (req, res) {
	var reqContext = appContext.createRequestContext(req);
    logger = reqContext.getLogger("/reset/attachments");
    logger.info('reset attachments triggered');
    //console.log('reset attachments triggered');
    util.resetTable(
        req,
		res,
        'Util.Attachments',
		'UtilShadow.Attachments',
        util.callback
    );
});

return app;
};
