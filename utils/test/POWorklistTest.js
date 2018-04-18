process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var chai = require('chai');
var chaiHttp = require('chai-http');
var should = chai.should();


var config = require('./../config.js');

var url=config.core_xsjs;
var jwt = "Bearer "+config.jwt;

chai.use(chaiHttp);
var purchaseorderId;





describe('PO_WORKLIST', function() {
    this.timeout(15000);
    it('Create PO - POST', function(done) {
        chai.request(url)
            .post("/sap/hana/democontent/epm/services/poCreate.xsodata/purchaseDetails")
            .set('Content-Type', 'application/json')
            .set('Authorization',jwt)
            .set('Accept', 'application/json')
            .send({
            "PARTNERID":"100000031",
            "PRODUCTID":"AD-1000",
            "QUANTITY":"3",
            "PURCHASEORDERID":"300000000",
            "PURCHASEORDERITEM":"10",
            "CURRENCY":"EUR",
            "GROSSAMOUNT":"1000",
            "NETAMOUNT":"1000",
            "TAXAMOUNT":"100",
            "QUANTITYUNIT":"EA",
            "DELIVERYDATE":"2015-01-01"
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
    
      it('Get all Purchase Orders - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/services/poWorklist.xsodata/PO_WORKLIST?$skip=0&$top=106&$inlinecount=allpages&$format=json")
            .set('Authorization',jwt)
            .end(function(err, res) {
                //console.log(res.status);
                //if (err) return done(err);
                res.should.have.status(200);
            //var data=res.body;
            //purchaseorderId=data["d"]["results"][0]["PURCHASEORDERID"];
            //console.log(purchaseorderId);
                done();
            });
      });
        
    
    it('Get all Purchase Orders where LIFECYCLE = N - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/services/poWorklist.xsodata/PO_WORKLIST?$skip=0&$top=106&$orderby=PURCHASEORDERID,PURCHASEORDERITEM%20asc&$filter=LIFECYCLESTATUS%20eq%20%27N%27&$format=json")
            .set('Authorization',jwt)
            .end(function(err, res) {
                //console.log(res.status);
                //if (err) return done(err);
                res.should.have.status(200);
            var data=res.body;
            purchaseorderId=data["d"]["results"][0]["PURCHASEORDERID"];
            //console.log(purchaseorderId);
                done();
            });
      });
    
    it('Get Purchase Order Items - GET', function(done) {
        //console.log("start");
        chai.request(url)
            .get("/sap/hana/democontent/epm/services/poWorklist.xsodata/PurchaseOrderItem?$skip=0&$top=106&$orderby=PURCHASEORDERITEM%20asc&$filter=PURCHASEORDERID%20eq%20%27"+purchaseorderId+"%27&$select=PURCHASEORDERITEM%2cPRODUCT_PRODUCTID%2cProductName%2cCATEGORY%2cQUANTITY%2cQUANTITYUNIT%2cGROSSAMOUNT%2cCURRENCY&$inlinecount=allpages&$format=json")
            .set('Authorization',jwt)
            .end(function(err, res) {
                //console.log(res.status);
                //if (err) return done(err);
                res.should.have.status(200);
            
            //console.log(purchaseorderId);
                done();
            });
      });
    
    it('Accept PO - POST', function(done) {
        chai.request(url)
            .post("/sap/hana/democontent/epm/services/poWorklistUpdate.xsjs?cmd=approval")
            .set('Content-Type', 'application/json')
            .set('Authorization',jwt)
            .set('Accept', 'application/json')
            .send({"payload":[{"purchaseOrderId":"300000001"},{"Action":"Accept"}]})
            .end(function(err, res) {
                //console.log(res.status);
                if (err){ return done(err);}
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();

            });
      });
    
    it('Reject PO - POST', function(done) {
        chai.request(url)
            .post("/sap/hana/democontent/epm/services/poWorklistUpdate.xsjs?cmd=approval")
            .set('Content-Type', 'application/json')
            .set('Authorization',jwt)
            .set('Accept', 'application/json')
            .send({"payload":[{"purchaseOrderId":"300000001"},{"Action":"Reject"}]})
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
    
    
   /* it('Delete PO - DELETE', function(done) {
        chai.request(url)
            .post("/sap/hana/democontent/epm/services/poWorklistUpdate.xsjs?cmd=delete")
            .set('Content-Type', 'application/json')
            .set('Accept', 'application/json')
            .send({"payload":[{"purchaseOrderId":purchaseorderId}]})
            .end(function(err, res) {
                //console.log(res.status);
                if (err) return done(err);
                //res=JSON.parse(res);
                res.should.have.status(200);
                //res.body.should.be.a('array');
                //res.body.length.should.be.eql(0);
             return  done();

            });
      });*/
    
      it('Super Search - GET', function(done) {
        chai.request(url)
            .get("/sap/hana/democontent/epm/services/poWorklistQuery.xsjs?cmd=filter&query=sap&page=1&start=0&limit=25&$format=json")
            .set('Authorization',jwt)
            .end(function(err, res) {
                //console.log(res.status);
                //if (err) return done(err);
                res.should.have.status(200);
                done();
            });
      });
      
  });
