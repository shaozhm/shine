var express = require('express');
var router = express.Router();
var winston = require('winston');

winston.level = process.env.winston_level || 'error'
router.get('/get/url/admin', function (req, res) {
    res.writeHead(200, {'Content-Type' : 'application/json'});
    res.end(JSON.stringify({url:process.env.ADMIN_UI}));
});

router.get('/get/url/poworklist', function (req, res) {
    res.writeHead(200, {'Content-Type' : 'application/json'});
    res.end(JSON.stringify({url:process.env.PURCHASE_UI}));
});

module.exports = router;