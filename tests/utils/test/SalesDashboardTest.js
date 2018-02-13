process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var config = require('./../config.js');

var url=config.core_xsjs;
var jwt = "Bearer "+config.jwt;

chai.use(chaiHttp);

var salesorderId;


 describe('SALESORDER DASHBOARD', function() {
     this.timeout(15000);
     it('Get Sales by Region - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/services/salesByRegion.xsodata/SalesByRegion?$skip=0&$top=4&$format=json")
            .set('Authorization',jwt)
            .end(function(err, res) {
            //console.log(res.status);
            if (err) return done(err);
            //res=JSON.parse(res);
            res.should.have.status(200);
            //res.body.should.be.a('array');
            //res.body.length.should.be.eql(0);
            done();
            return;
            });
      });
     
     it('Get Sales by Country - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/services/salesByCountry.xsodata/SalesByCountry?$skip=0&$top=16&$format=json")
            .set('Authorization',jwt)
            .end(function(err, res) {
            //console.log(res.status);
            if (err) return done(err);
            //res=JSON.parse(res);
            res.should.have.status(200);
            //res.body.should.be.a('array');
            //res.body.length.should.be.eql(0);
            done();
            return;
            });
      });
     
     it('Get SalesDiscount   - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/services/salesDiscount.xsodata/sales?&$format=json")
            .set('Authorization',jwt)
            .end(function(err, res) {
            //console.log(res.status);
            if (err) return done(err);
            //res=JSON.parse(res);
            res.should.have.status(200);
            //res.body.should.be.a('array');
            //res.body.length.should.be.eql(0);
            done();
            return;
            });
      });
     
     it('Get Sales rank   - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/services/salesSalesRank.xsodata/salesRank?$skip=0&$top=10&$format=json")
            .set('Authorization',jwt)
            .end(function(err, res) {
            //console.log(res.status);
            if (err) return done(err);
            //res=JSON.parse(res);
            res.should.have.status(200);
            //res.body.should.be.a('array');
            //res.body.length.should.be.eql(0);
            done();
            return;
            });
      });
     
     it('Get Sales year compare   - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/services/salesYearCompare.xsodata/InputParams(IP_YEAR_1=2016,IP_YEAR_2=2017)/Results?$skip=0&$top=2&$format=json")
            .set('Authorization',jwt)
            .end(function(err, res) {
            //console.log(res.status);
            if (err) return done(err);
            //res=JSON.parse(res);
            res.should.have.status(200);
            //res.body.should.be.a('array');
            //res.body.length.should.be.eql(0);
            done();
            return;
            });
      });
     
     it('Get Sales by product   - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/services/salesByProduct.xsodata/SalesByProduct?$skip=0&$top=641&$format=json")
            .set('Authorization',jwt)
            .end(function(err, res) {
            //console.log(res.status);
            if (err) return done(err);
            //res=JSON.parse(res);
            res.should.have.status(200);
            //res.body.should.be.a('array');
            //res.body.length.should.be.eql(0);
            done();
            return;
            });
      });
     
      it('Create Sales Order - POST', function(done) {
        chai.request(url)
            .post("/sap/hana/democontent/epm/services/soCreateMultiple.xsjs")
            .set('Authorization',jwt)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send({
            "PARTNERID":"100000028",
            "SalesOrderItems":[{"Product_Id":"HT-1020","Quantity":"1"}]
        })
            .end(function(err, res) {
               // console.log(res.status);
                if (err) return done(err);
                //res=JSON.parse(res);
                res.should.have.status(201);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();

            });
      });
     
      it('Get Sales Orders - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/services/salesOrdersBuyer.xsodata/SalesOrderHeader?$skip=0&$top=110&$orderby=SALESORDERID%20desc&$select=SALESORDERID%2cCURRENCY%2cGROSSAMOUNT%2cTAXAMOUNT%2cPARTNER_PARTNERID%2cCOMPANYNAME%2cCITY&$inlinecount=allpages&$format=json")
            .set('Authorization',jwt)
            .end(function(err, res) {
            //console.log(res.status);
            if (err) return done(err);
            //res=JSON.parse(res);
            res.should.have.status(200);
            var data=res.body;
            salesorderId=data["d"]["results"][0]["SALESORDERID"];
            //res.body.should.be.a('array');
            //res.body.length.should.be.eql(0);
            done();
            return;
            });
      });
     
     it('Get Sales Order items - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/services/salesOrdersBuyer.xsodata/SalesOrderHeader('"+salesorderId+"')/SalesOrderItem?$skip=0&$top=108&$inlinecount=allpages&$format=json")
            .set('Authorization',jwt)
            .end(function(err, res) {
            //console.log(res.status);
            if (err) return done(err);
            //res=JSON.parse(res);
            res.should.have.status(200);
            
            //res.body.should.be.a('array');
            //res.body.length.should.be.eql(0);
            done();
            return;
            });
      });
     
      it('Delete Salesorder - DELETE', function(done) {
        chai.request(url)
            .delete("/sap/hana/democontent/epm/services/soDelete.xsodata/so_details('"+salesorderId+"')")
            .set('Authorization',jwt)
            .end(function(err, res) {
              //console.log(salesorderId);
                //console.log(res.status);
                if (err) return done(err);
                //res=JSON.parse(res);
                res.should.have.status(204);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();
            });
      })
      
  });
