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
var port = apiConfig.port_userjs;
var url="https://"+host + ":" +port;


//var url="https://mo-d5a730025.mo.sap.corp:51515";
chai.use(chaiHttp);

 describe('JOB SCHEDULER', function() {
      it('Get all Jobs - GET', function(done) {
        chai.request(url)
            .get("/schedules/getjobschedules")

            .end(function(err, res) {
                //console.log(res.status);
                if (err) return done(err);
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
              done();
            });
      });
      /*it('Create Job - POST', function(done) {
        chai.request(url)
            .post("/schedules/createjobschedule")
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send({  
                   "appurl":"https://mo-d5a730025.mo.sap.corp:51125/jobactivity/create",*/
                   //"cron":"* * * * * * */40",
                   /*"description":"Desc",
                   "endtime":"2016-10-05 16:00:44 +0530",
                   "jobname":"NewJob",
                   "password":"QWJjZDEyMzQ=",
                   "starttime":"2016-10-04 16:00:44 +0530",
                   "user":"DEVX_TECH_USER"
                })
            .end(function(err, res) {
                //console.log(res.status);
                if (err) return done(err);
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
              done();
            });
      });
*/      
  });


