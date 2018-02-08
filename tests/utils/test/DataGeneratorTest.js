process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();

var config = require('./../config.js');

var url=config.core_node;
var jwt = "Bearer "+config.jwt;

chai.use(chaiHttp);
var salesorderId;

 describe('DATA GENERATOR', function() {
     this.timeout(15000);
     
      it('Get Tablesize - GET', function(done) {
        chai.request(url)
            .get("/get/tablesize")
			.set('Authorization',jwt)
            .end(function(err, res) {
                //console.log(res.status);
                if (err) {return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
              
              return done();
            });
      });
      
      
      it('Create Sales - POST', function(done) {
        chai.request(url)
            .post("/replicate/sales")
            .set('Content-Type', 'application/json')
            .set('Authorization',jwt)
            .set('Accept', 'application/json')
        .send()
            
            .end(function(err, res) {
             
               // console.log(res.status);
                if (err) {return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
     
     it('Create Purchase - POST', function(done) {
        chai.request(url)
            .post("/replicate/purchase")
            .set('Authorization',jwt)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send()
            .end(function(err, res) {
             
               // console.log(res.status);
                if (err) {return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
     
     it('Create timebasedPO - POST', function(done) {
        chai.request(url)
            .post("/replicate/timebasedPO")
            .set('Content-Type', 'application/json')
            .set('Authorization',jwt)
            .set('Accept', 'application/json')
            .send({"startdate":"Mon Jun 12 2017","enddate":"Wed Jul 12 2017","noRec":1,"dummy":"1499838373188","id":"PurchaseOrderId"})
            .end(function(err, res) {
                //console.log(res.status);
                if (err) {return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();

            });
      });
     
     it('Create timebasedSO - POST', function(done) {
        chai.request(url)
            .post("/replicate/timebasedPO")
            .set('Content-Type', 'application/json')
            .set('Authorization',jwt)
            .set('Accept', 'application/json')
            .send({"startdate":"Mon Jun 12 2017","enddate":"Wed Jul 12 2017","noRec":1,"dummy":"1499838373439","id":"SalesOrderId"})
            .end(function(err, res) {
                //console.log(res.status);
                if (err) {return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();

            });
      });
     
     it('Reset addresses - POST', function(done) {
        chai.request(url)
            .post("/reset/addresses")
            .set('Content-Type', 'application/json')
            .set('Authorization',jwt)
            .set('Accept', 'application/json')
            .end(function(err, res) {
             
               // console.log(res.status);
                if (err) {return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
     
     
     it('Reset partners - POST', function(done) {
        chai.request(url)
            .post("/reset/partners")
            .set('Content-Type', 'application/json')
            .set('Authorization',jwt)
            .set('Accept', 'application/json')
            .end(function(err, res) {
             
               // console.log(res.status);
                if (err) {return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
     
     it('Reset employees - POST', function(done) {
        chai.request(url)
            .post("/reset/employees")
        	.set('Content-Type', 'application/json')
        	.set('Authorization',jwt)
            .set('Accept', 'application/json')
            .end(function(err, res) {
             
               // console.log(res.status);
                if (err) {return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
     
     it('Reset products - POST', function(done) {
        chai.request(url)
            .post("/reset/products")
    		.set('Content-Type', 'application/json')
    		.set('Authorization',jwt)
            .set('Accept', 'application/json')
            .end(function(err, res) {
             
               // console.log(res.status);
                if (err) {return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
     
     it('Reset constants - POST', function(done) {
        chai.request(url)
            .post("/reset/constants")
        	.set('Content-Type', 'application/json')
        	.set('Authorization',jwt)
            .set('Accept', 'application/json')
            .end(function(err, res) {
             
               // console.log(res.status);
                if (err) {return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
     
     it('Reset texts - POST', function(done) {
        chai.request(url)
            .post("/reset/texts")
        	.set('Content-Type', 'application/json')
        	.set('Authorization',jwt)
            .set('Accept', 'application/json')
            .end(function(err, res) {
             
               // console.log(res.status);
                if (err) {return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
     
     it('Reset notes - POST', function(done) {
        chai.request(url)
            .post("/reset/notes")
        	.set('Content-Type', 'application/json')
        	.set('Authorization',jwt)
            .set('Accept', 'application/json')
            .end(function(err, res) {
             
               // console.log(res.status);
                if (err) {return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
     it('Reset attachments - POST', function(done) {
        chai.request(url)
            .post("/reset/attachments")
        	.set('Content-Type', 'application/json')
        	.set('Authorization',jwt)
            .set('Accept', 'application/json')
            .end(function(err, res) {
             
               // console.log(res.status);
                if (err) {return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
     
     it('Reset soheader - POST', function(done) {
        chai.request(url)
            .post("/reset/soheader")
        	.set('Content-Type', 'application/json')
        	.set('Authorization',jwt)
            .set('Accept', 'application/json')
            .end(function(err, res) {
             
               // console.log(res.status);
                if (err) {return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
     
     it('Reset soitem - POST', function(done) {
        chai.request(url)
            .post("/reset/soitem")
    		.set('Content-Type', 'application/json')
    		.set('Authorization',jwt)
            .set('Accept', 'application/json')
            .end(function(err, res) {
             
               // console.log(res.status);
                if (err){ return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
     
     it('Reset poheader - POST', function(done) {
        chai.request(url)
            .post("/reset/poheader")
        	.set('Content-Type', 'application/json')
        	.set('Authorization',jwt)
            .set('Accept', 'application/json')
            .end(function(err, res) {
             
               // console.log(res.status);
                if (err) {return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
     
     it('Reset poitem - POST', function(done) {
        chai.request(url)
            .post("/reset/poitem")
        	.set('Content-Type', 'application/json')
        	.set('Authorization',jwt)
            .set('Accept', 'application/json')
            .end(function(err, res) {
             
               // console.log(res.status);
                if (err) {return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      });
     
      
  });
