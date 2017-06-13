var xsconn = require('@sap/hdbext');
var xsenv = require('@sap/xsenv');

var manager = require('./manager');
var utils = require('./utils');
var logger = utils.logger;


// transaction and database connection management

// transaction id for
var txId = 0;

// find HANA service binding
var hanaOptions = xsenv.getServices({
    hana: process.env.HANA_SERVICE_NAME || { tag: 'hana' }
}).hana;

// control opening of new database connections
var proxy = xsconn.getPool(hanaOptions);


// get transaction associated with open database connection

exports.getClient = function(dbconn, callback) {
    var initClient = function(cl) {
        cl.setAutoCommit(false);  // auto commit handled by node-cds
        exports._autoCommit(cl, true);
        cl.$_tx_id = ++txId;
        manager.openCache(cl);
    };
    if (dbconn) {
        if (!dbconn.$_tx_id)
            initClient(dbconn);
        if (dbconn.readyState === "connected")
            callback(null, dbconn);
        else
            dbconn.connect(function (err) { callback(err, dbconn); });
    } else {
        proxy.acquire(null, function(err, client) {
            if (!err)
                initClient(client);
            callback(err, client);
        });
    }
};

exports.releaseClient = function(client, dbconn) {
    if (dbconn) {
        // don't touch connection, in particular keep it connected
        // dbconn.disconnect(cb);
    } else {
        if (client.$_tx_id)
            manager.closeCache(client);
        proxy.release(client);
    }
};


// transaction handling

exports._autoCommit = function (client, auto) {
    client.$_autoCommit = auto;
};

exports._commit = function (client, callback) {
    client.commit(callback);
};

exports._rollback = function (client, callback) {
    manager._clearCaches(client);
    client.rollback(callback);
};