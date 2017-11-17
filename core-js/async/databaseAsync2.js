/* eslint-disable */
"use strict";
var hana = require("./database");
var async = require("async");

module.exports = {
   dbCall: function(wss){
async.parallel([
	function(cb){wss.broadcast("Before Database Call"); cb();},
	function(cb){hana.callHANA1(cb, wss); },
	function(cb){hana.callHANA2(cb, wss); },
	function(cb){wss.broadcast("After Database Call"); cb();} 
],	function(err){
		wss.broadcast("---Everything's Really Done Now. Go Home!---");
	});

  }
};