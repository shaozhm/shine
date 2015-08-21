'use strict';

var xsjs = require('xsjs');
var xsenv = require('xsenv');
var port = process.env.PORT || 3000;

var options = xsenv.getServices({
  hana: process.env.HANA_SERVICE_NAME,
  uaa: process.env.UAA_SERVICE_NAME
});
console.log(JSON.stringify(options));

xsjs(options).listen(port);
console.log('Server listening on port %d', port);
