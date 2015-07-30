// util.js
// ========
module.exports = {
  resetTable: function (req, res, origTable, shadowTable, callback) {
    console.log('reset table called with ' + origTable + ' and ' + shadowTable);
    var client = req.db;
    client.exec('truncate table "sap.hana.democontent.epm.data::' 
        + origTable + '"', 
        function(error, response) {
            console.log('truncate ' + error + ' ' + response);
            if (error) {
                callback(error, null, res, origTable);
            } else {
                var query = 'insert into "sap.hana.democontent.epm.data::' 
                            + origTable 
                            + '" select * from "sap.hana.democontent.epm.data.shadow::'
                            + shadowTable + '"';
                client.exec(query, function(error1, response1){
                    console.log('insert from shadow ' + error1 + ' ' + response1);
                    callback(error, response, res, origTable);
                    // client.end();
                });
            }
    });
  },
  getTableInfo: function(client, tableName, tableSynonym, callback) {
    var queryPrefix = 'SELECT "RECORD_COUNT","TABLE_SIZE" FROM "SYS"."M_TABLES" where "TABLE_NAME"=\'sap.hana.democontent.epm.data::';
    client.exec(queryPrefix + tableName + "'", 
        function(error, response) {
            console.log('get table info ' + tableName 
                            + " " + error + ' ' + JSON.stringify(response));
            if (response) {
                response[0]["TABLE_SYNONYM"] = tableSynonym;
            }
            callback(error, response);
    });
  },
  callback: function(error, response, res, origTable) {
    if (error) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(error));
    } else {
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({message: origTable + " reset successfully"}));
    }
  }
};
