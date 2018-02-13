process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();
var setup = require("./setup");

var config = require('./../config.js');

var url=config.core_xsjs;
var jwt = "Bearer "+config.jwt;

chai.use(chaiHttp);

var businessartnerId, latitude, longitude, productId;

describe('SPATIAL DEMO', function() {
     this.timeout(15000);
     it('Get all Business Partner Data - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/spatial/services/getAllBusinessPartnersData.xsjs&$format=json")
            .set('Authorization',jwt)
            .end(function(err, res) {
            //console.log(res.status);
            if (err) return done(err);
            //res=JSON.parse(res);
            res.should.have.status(200);
            var data=res.body;
            businessartnerId=data["entry"][0]["ID"];
            latitude=data["entry"][0]["lat"];
            longitude=data["entry"][0]["long"];
            //console.log(businessartnerId);
            //res.body.should.be.a('array');
            //res.body.length.should.be.eql(0);
            done();
            return;
            });
      });
    
    it('Get all Business Partner Data - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/spatial/services/getBPTransactionData.xsjs?cmd=getData&bpId="+businessartnerId+"&lat="+latitude+"&long="+longitude+"&userlat=undefined&userlong=undefined&$format=json")
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
     
    it('getSalesAnalysis - POST', function(done) {
        chai.request(url)
            .post("/sap/hana/democontent/epm/spatial/services/getSalesAnalysis.xsjs")
            .set('Authorization',jwt)
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send({"points":[{"lat":52.14750190129714,"long":-15.891992187499994},{"lat":52.14750190129714,"long":22.691992187500006},{"lat":48.76399891753171,"long":22.691992187500006},{"lat":48.76399891753171,"long":-15.891992187499994},{"lat":52.14750190129714,"long":-15.891992187499994}]})
            .end(function(err, res) {
                //console.log(res.status);
                if (err) return done(err);
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();

            });
      });
    it('Get Product Details - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/spatial/services/productSales.xsodata/ProductDetails?$skip=0&$top=100&$orderby=PRODUCT_NAME%20asc&$select=PRODUCTID%2cPRODUCT_NAME&$format=json")
            .set('Authorization',jwt)
            .end(function(err, res) {
            //console.log(res.status);
            if (err) return done(err);
            //res=JSON.parse(res);
            res.should.have.status(200);
            var data1=res.body;
            productId=data1["d"]["results"][0]["PRODUCTID"];
            //console.log(productId);
            //res.body.should.be.a('array');
            //res.body.length.should.be.eql(0);
            done();
            return;
            });
      });
    
    it('Get Product Sales - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/spatial/services/productSales.xsodata/ProductSales?$skip=0&$top=1&$filter=PRODUCT_PRODUCTID%20eq%20%27"+productId+"%27&$format=json")
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
    
    it('Get ProductRegionQuantity - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/spatial/services/productSales.xsodata/ProductRegionQuantity?$filter=PRODUCT_PRODUCTID%20eq%20%27"+productId+"%27&$format=json")
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
    
  });
