/*eslint no-console: 0, no-unused-vars: 0, no-undef: 0, no-shadow: 0, consistent-return: 0*/
/*eslint-env node, es6 */
"use strict";
var hdb = require("@sap/hdbext");
var xsenv = require("@sap/xsenv");
var async = require("async");
var hanaOptions = xsenv.getServices({
	hana: {
		tag: "hana"
	}
});
var pool = hdb.getPool(hanaOptions.hana);

module.exports = {
	callHANA: (wss) => {
		pool.acquire(null, (error, client) => {
			if (error) {
				console.error(error);
			}
			if (client) {
				wss.broadcast("Database Connected");
				client.exec("select TOP 25 * from \"PO.Header\"",
					(err, res, cb) => {
						if (err) {
							return (`ERROR: ${err.toString()}`);
						}
						wss.broadcast("Database Call Complete");
						for (let item of res) {
							wss.broadcast(`${item.PURCHASEORDERID}: ${item.GROSSAMOUNT}\n`);
						}
						client.disconnect((cb) => {
							wss.broadcast("Database Disconnected");
							pool.release(client);
						});
					});
			} //End if client
		}); //end create connection      
		cb();
	}, //end callHANA

	callHANA1: (cb, wss) => {
		//hdb.createConnection(hanaService, function(error, client) {
		pool.acquire(null, (error, client) => {
			if (error) {
				console.error(error);
			}
			if (client) {
				async.waterfall([
					function execute(callback) {
						wss.broadcast("Database Connected #1");
						client.exec("select TOP 25 * from \"PO.Header\"",
							(err, res) => {
								if (err) {
									return (`ERROR: ${err.toString()}`);
								}
								callback(null, err, res);
							});

					},

					function processResults(err, res, callback) {
						if (err) {
							return (`ERROR: ${err.toString()}`);
						}
						wss.broadcast("Database Call  #1");
						wss.broadcast("--PO Header");
						for (let item of res) {
							wss.broadcast(`${item.PURCHASEORDERID}: ${item.GROSSAMOUNT}`);
						}
						wss.broadcast("\n");
						client.disconnect();
						wss.broadcast("Database Disconnected #1");
						wss.broadcast("End Waterfall #1");
						pool.release(client);
						cb();
					},

					function disconnectDone(callback) {
						wss.broadcast("Database Disconnected #1");
						wss.broadcast("End Waterfall #1");
						pool.release(client);
						cb();
					}

				], (err, result) => {
					wss.broadcast(err || "done");
					wss.broadcast("Error Occured disrupting flow of Waterfall for #1");
					pool.release(client);
					cb();
				}); //end Waterfall

			} //end if client
		}); //end create connection

	}, //end callHANA1

	callHANA2: (cb, wss) => {

			//hdb.createConnection(hanaService, function(error, client) {
			pool.acquire(null, (error, client) => {
				if (error) {
					console.error(error.toString());
				}
				if (client) {
					async.waterfall([
						function execute(callback) {
							wss.broadcast("Database Connected #2");
							client.exec("select TOP 25 * from \"PO.Item\"",
								(err, res) => {
									if (err) {
										return (`ERROR: ${err.toString()}`);
									}
									callback(null, err, res);
								});

						},

						function processResults(err, res, callback) {
							if (err) {
								return (`ERROR: ${err.toString()}`);
							}
							wss.broadcast("Database Call  #2");
							wss.broadcast("--PO Items");
							for (let item of res) {
								wss.broadcast(`${item["HEADER.PURCHASEORDERID"]}: ${item["PRODUCT.PRODUCTID"]}`);
							}
							wss.broadcast("\n");
							client.disconnect();
							wss.broadcast("Database Disconnected #2");
							wss.broadcast("End Waterfall #2");
							pool.release(client);
							cb();
						},

						function disconnectDone(callback) {
							wss.broadcast("Database Disconnected #2");
							wss.broadcast("End Waterfall #2");
							pool.release(client);
							cb();
						}

					], (err, result) => {
						wss.broadcast(err || "done");
						wss.broadcast("Error Occured disrupting flow of Waterfall for #2");
						pool.release(client);
						cb();
					}); //end Waterfall
				} //end if client
			}); //end create connection

		} //end callHANA2
};