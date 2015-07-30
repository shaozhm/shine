'use strict';
var http = require('http');
var xs2sec = require('xs2sec');
var express = require('express');
var passport = require('passport');
var xs_hdb_conn = require('xs-hdb-connection');
var routes = require('./routes/index');
var winston = require('winston');
var node_xs2sec_middleware = require('node-xs2sec-middleware');
var xsenv = require('xsenv');

var PORT = process.env.PORT || 3000;
var app = express();

//log level
winston.level = process.env.winston_level || 'error'

/**
 * Setup JWT authentication strategy
 * The default UAA credentials can be overriden
 * by defining a user defined service called 'uaa'.
 */
passport.use('JWT', new xs2sec.JWTStrategy(xsenv.getServices().uaa));


//use passport for authentication
app.use(passport.initialize());

/*
 * Use JWT password policy for all routes. As the
 * xs_hdb_conn middleware depends on a correctly set userinfo
 * with samlToken it is important to add the passport
 * middleware before the xs_hdb_conn middleware.
 *
 * use database connection pool provided by xs_hdb_conn
 * provides a db property containing the connection
 * object to the request object of all routes.
 */
app.use('/', node_xs2sec_middleware.middleware(), xs_hdb_conn.middleware(), routes.datagen, routes.reset, routes.get);

//start the HTTP server
app.listen(PORT, function () {
    console.log('Server running on http://localhost:' + PORT);
});
