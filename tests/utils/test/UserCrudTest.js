process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var config = require('./../config.js');

var url=config.user_xsjs;
chai.use(chaiHttp);
var userId;
var jwt = "Bearer "+config.jwt;
console.log("START");
 describe('USER CRUD', function() {
     this.timeout(15000);
      it('Create User - POST', function(done) {
        chai.request(url)
            .post("/user/xsodata/user.xsodata/Users")
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .set('Authorization',jwt)
            .send({  
                 "FirstName":"2df",
                 "LastName":"2sds",
                 "Email":"2sdf",
                 "UserId":1
              })
            .end(function(err, res) {
                //console.log(res.status);
                if (err) {return done(err);}
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
			.set('Authorization',jwt)
            .end(function(err, res) {
                //console.log(res.status);
                if (err) {return done(err);}
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
            .set('Authorization',jwt)
            .send({"FirstName": "new", "LastName": "new", "Email": "2sdf", "UserId": userId})
            .end(function(err, res) {
              //console.log(userId);
                //console.log(res.status);
                if (err){ return done(err);}
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
            .set('Authorization',jwt)
            .end(function(err, res) {
              //console.log(userId);
                //console.log(res.status);
                if (err){ return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(204);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
      
  });


