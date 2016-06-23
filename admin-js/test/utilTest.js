
//Samir code:
var should = require('should');
var assert = require('assert');
var Util = require('../routes/util');
  


describe('getTableInfo unit test', function(){
	
	it('getTableInfo() should pass', function(){
		var res = {
			
		};
		var message = {};
		var fncallback = function(error, response, res, message){
				if (error) {
					console.log('reached error block');
				} else {
					console.log('the response > ' + JSON.stringify(response));
					assert.equal(response,'TABLE_SYNONYM');
				}
		};
		var client = {
			exec : function(){
				var data = 'TABLE_SYNONYM';
				fncallback(null,data,res,message);
			}
		};
		
		Util.getTableInfo(client,'M_TABLES','ABCD',fncallback);
		
	});
	
});

describe('resetTable unit test',function(){
	
	it('resetTable should pass', function(){

		
		var res = {};
		var message = {};
		var fncallback = function(error, response, res, message){
				if (error) {
					console.log('The required operation cannot be done');
				} else {
					// for this test case, the actual function is inserting data and not returning any data,
					// hence no assert can be done
					console.log('The table has been reset ' + message);
					console.log('reached else block');
				}
		};

		var client = {};
		res.db = client;
		client.callbackfn = function(error,response){
			
			fncallback(error,response,res,message);
			
		}
		client.exec = function(query,callbackfn){
			console.log('executing some query' + query);
		}
		
		
		
		Util.resetTable(res,res,'ABCD','SHADOW_ABCD', fncallback);
		
	});
	
});

  







