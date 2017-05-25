var express = require('express');
var async = require('async');
var cds = require('@sap/cds');
var router = express.Router();
var winston = require('winston');
var util = require('./util');

winston.level = process.env.winston_level || 'error'
router.post('/reset/soheader', function (req, res) {
    console.log('reset so header triggered');
    util.resetTable(
        req, 
        res,
        "SO.Header", 
        "SOShadow.Header",
        util.callback
    );
});

router.post('/reset/soitem', function (req, res) {
    console.log('reset so item triggered');
    util.resetTable(
        req, 
        res,
        "SO.Item", 
        "SOShadow.Item",
        util.callback
    );
});

router.post('/reset/poheader', function (req, res) {
    console.log('reset po header triggered');
    util.resetTable(
        req, 
        res,
        "PO.Header", 
        "POShadow.Header",
        util.callback
    );
});

router.post('/reset/poitem', function (req, res) {
    console.log('reset po item triggered');
    util.resetTable(
        req, 
        res,
        "PO.Item", 
        "POShadow.Item",
        util.callback
    );
});

router.post('/reset/addresses', function (req, res) {
    console.log('reset addresses triggered');
    util.resetTable(
        req, 
        res,
        "MD.Addresses", 
        "MDShadow.Addresses",
        util.callback
    );
});

router.post('/reset/partners', function (req, res) {
    console.log('reset business partners triggered');
    util.resetTable(
        req, 
        res,
        "MD.BusinessPartner", 
        "MDShadow.BusinessPartner",
        util.callback
    );
});

router.post('/reset/employees', function (req, res) {
    console.log('reset employees triggered');
    util.resetTable(
        req, 
        res,
        "MD.Employees", 
        "MDShadow.Employees",
        util.callback
    );
});

router.post('/reset/products', function (req, res) {
    console.log('reset products triggered');
    util.resetTable(
        req, 
        res,
        "MD.Products", 
        "MDShadow.Products",
        util.callback
    );
});

router.post('/reset/constants', function (req, res) {
    console.log('reset constants triggered');
    util.resetTable(
        req, 
        res,
        "Util.Constants", 
        "UtilShadow.Constants",
        util.callback
    );
});

router.post('/reset/texts', function (req, res) {
    console.log('reset texts triggered');
    util.resetTable(
        req, 
        res,
        "Util.Texts", 
        "UtilShadow.Texts",
        util.callback
    );
});

router.post('/reset/notes', function (req, res) {
    console.log('reset notes triggered');
    util.resetTable(
        req, 
        res,
        "Util.Notes", 
        "UtilShadow.Notes",
        util.callback
    );
});

router.post('/reset/attachments', function (req, res) {
    console.log('reset attachments triggered');
    util.resetTable(
        req, 
        res,
        "Util.Attachments", 
        "UtilShadow.Attachments",
        util.callback
    );
});

module.exports = router;