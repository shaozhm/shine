var express = require('express');
var async = require('async');
var cds = require('cds');
var router = express.Router();
var winston = require('winston');
var util = require('./util');

winston.level = process.env.winston_level || 'error'
router.get('/datagen/reseedMultiple', function (req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({message: "Not implemented."}));
});

router.get('/datagen/reseedTimeBased', function (req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({message: "Not implemented."}));
});

module.exports = router;