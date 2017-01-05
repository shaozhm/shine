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
var userId;

 describe('USER CRUD', function() {
      it('Create User - POST', function(done) {
        chai.request(url)
            .post("/user/xsodata/user.xsodata/Users")
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send({  
                 "FirstName":"2df",
                 "LastName":"2sds",
                 "Email":"2sdf",
                 "UserId":1
              })
            .end(function(err, res) {
                //console.log(res.status);
                if (err) return done(err);
                //res=JSON.parse(res);
                res.should.have.status(201);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
      it('Read Users - GET', function(done) {
        chai.request(url)
            .get("/user/xsodata/user.xsodata/Users?$format=json")

            .end(function(err, res) {
                //console.log(res.status);
                if (err) return done(err);
                //res=JSON.parse(res);
                res.should.have.status(200);
                var json=res.body;
                userId=json["d"]["results"][0]["UserId"];
                //console.log(userId);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
              done();
              return;
            });
      });
      it('Update User - PUT', function(done) {
        chai.request(url)
            .put("/user/xsodata/user.xsodata/Users("+userId+")")//1000000228)")
            .send({"FirstName": "new", "LastName": "new", "Email": "2sdf", "UserId": userId})
            .end(function(err, res) {
              //console.log(userId);
                //console.log(res.status);
                if (err) return done(err);
                //res=JSON.parse(res);
                res.should.have.status(204);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
      
      it('Delete User - DELETE', function(done) {
        chai.request(url)
            .delete("/user/xsodata/user.xsodata/Users("+userId+")")//1000000228)")
            .end(function(err, res) {
              //console.log(userId);
                //console.log(res.status);
                if (err) return done(err);
                //res=JSON.parse(res);
                res.should.have.status(204);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
      
  });


