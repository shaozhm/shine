'use strict';
var http = require('http');
var express = require('express');
var routes = require('./routes/index');
var winston = require('winston');

var PORT = process.env.PORT || 3000;
var app = express();

//log level
winston.level = process.env.winston_level || 'error';

app.use('/', routes.get);

//start the HTTP server
app.listen(PORT, function () {
    console.log('Server running on http://localhost:' + PORT);
});
