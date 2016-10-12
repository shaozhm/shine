process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();

var path = require('path')
var fs = require('fs')
var assert = require('assert')
var argv = require('optimist').demand('config').argv
var configFilePath = argv.config
assert.ok(fs.existsSync(configFilePath), 'config file not found at path: ' + configFilePath)
var config = require('nconf').env().argv().file({file: configFilePath})
var apiConfig = config.get('api')
//var apiKey = apiConfig.key;
var host = apiConfig.host;
var port = apiConfig.port_corejs;
var url="https://"+host + ":" +port;

//var url="https://mo-d5a730025.mo.sap.corp:51510";
chai.use(chaiHttp);

 describe('PO_WORKLIST', function() {
      it('Get all Purchase Orders - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/services/poWorklist.xsodata/PO_WORKLIST?$skip=0&$top=106&$inlinecount=allpages&$format=json")
            .end(function(err, res) {
                console.log(res.status);
                //if (err) return done(err);
                res.should.have.status(200);
                done();
            });
      });
      it('Super Search - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/services/poWorklistQuery.xsjs?cmd=filter&query=sap&page=1&start=0&limit=25&$format=json")
            .end(function(err, res) {
                console.log(res.status);
                //if (err) return done(err);
                res.should.have.status(200);
                done();
            });
      });
      
  });


