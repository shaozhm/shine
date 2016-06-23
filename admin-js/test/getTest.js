var request = require('supertest')
  , express = require('express');

var app = express();

app.get('/get/sessioninfo', function(req, res){
  //res.send(200, { name: 'tobi' });
  res.status(200);
  res.send({ name: 'tobi' });
});

describe("Test", function(){
	
	it('tests', function(done){
		
	request(app)
  .get('/get/sessioninfo')
  .expect('Content-Type', /json/)
  .expect('Content-Length', '15')
  .expect(200)
  .end(function(err, res){
    if (err) done(err);
	done();
  });
	});
	
});

