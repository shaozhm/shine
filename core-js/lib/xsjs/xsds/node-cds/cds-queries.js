var Transform = require('stream').Transform;

var transaction = require('./transaction');
var utils = require('./utils');
var logger = utils.logger;

/*********************************************************************************
 * Queries
 *********************************************************************************/

/** @class Query
 * @memberof cds
 */
function createQuery(client, refs) {
    if (!client || client.constructor.name!=='Client') {
        refs = client;
        client = undefined;
    }
    if (Object.prototype.toString.call(refs) === '[object Array]') {
        var param = {};
        for (var k = 0; k < refs.length; k++) {
            param[refs[k].alias] = {
                entity: refs[k].entity
            };
        }
        return new Query(client, param).$defaultProject(refs.map(function (r) {
            return r.alias;
        }));
    } else {
        for (var ref in refs) {
            var proj = refs[ref].projection;
            for (var k = 0; k<proj.length; k++) {
                Query.addExpressionFunctions(proj[k].entity, refs[ref], ref);
            }
        }
        return new Query(client, refs);
    }
}

/*********************************************************************************
 * References
 *********************************************************************************/

function Ref(entity, alias) {
    this.entity = entity;
    this.alias = alias;
    Query.addExpressionFunctions(entity, this, alias);
}

Ref.prototype = function () {

    return {
        constructor: Ref,
        $query: function () {
            return this.entity.$from(this.alias);
        }
    };

}();

/*********************************************************************************
 * Parameters
 *********************************************************************************/

function Par(id) {
    this._parId = [id];
}

/*********************************************************************************
 * Query types
 *********************************************************************************/

var queryCount = 0;

Query.QueryType = {
    SELECT: "SELECT",
    INSERT: "INSERT",
    UPDATE: "UPDATE",
    UPSERT: "UPSERT",
    DELETE: "DELETE"
};

Query.JoinType = {
    INNER: "INNER",
    LEFTOUTER: "LEFT OUTER",
    RIGHTOUTER: "RIGHT OUTER",
    FULLOUTER: " FULL OUTER"
};

function errorQuery(error) {
    var q = new Query();
    for (p in q) {
        q[p] = function() {
            return q;
        }
    }
    q.error = error;
    q.$execute = function(client, config, callback) {
        var params = AbstractQuery.Private.normalizeExecuteCallParams(this, client, config, callback);
        params.callback(error);
    };
    return q;
}

/*********************************************************************************
 * AbstractQuery constructor
 *********************************************************************************/

function AbstractQuery(client, entities, leadingAlias, aliasSynonyms) {
    this.qconn = client;
    if (entities) {
        this.type = Query.QueryType.SELECT;
        this.entities = entities;
        this.aliasSynonyms = aliasSynonyms;
        this.leadingAlias = leadingAlias ? leadingAlias : Object.keys(entities)[0];
    }
}

AbstractQuery.prototype = function () {
    function _addOperation(option, allowedOptions) {
        var result = "";
        for (var i = 0; result.length === 0 & i < allowedOptions.length; i++) {
            if (option && allowedOptions[i] in option && option[allowedOptions[i]]) {
                result += allowedOptions[i].toUpperCase().replace("$", "") + " ";
            }
        }
        return result;
    }

    function union(query, option) {
        return new SetQuery(this.qconn, this, " UNION " + _addOperation(option, ["$all", "$distinct"]), query, this.entities, this.leadingAlias, this.aliasSynonyms);
    }

    function intersect(query, option) {
        return new SetQuery(this.qconn, this, " INTERSECT " + _addOperation(option, ["$distinct"]), query, this.entities, this.leadingAlias, this.aliasSynonyms);
    }

    function except(query, option) {
        return new SetQuery(this.qconn, this, " EXCEPT " + _addOperation(option, ["$distinct"]), query, this.entities, this.leadingAlias, this.aliasSynonyms);
    }

    return {
        constructor: AbstractQuery,

        /**
         * Unites two queries. The queries must have the same number of columns. Additionally the columns must have the same types.
         *
         * @param {boolean} [option.$all] if true, selects all records from all select statements. Duplicates are not removed.
         * @param {boolean} [option.$distinct] if true, selects all unique records from all select statements by removing duplicates found from different select statements.
         *                                     UNION has the same function as UNION DISTINCT.
         * @function
         * @memberof cds.Query.prototype
         * @example var sales2014And2015 = sales2014.$union(sales2015, {$all: true});
         */
        $union: union,

        /**
         * Intersects two queries. The queries must have the same number of columns. Additionally the columns must have the same types.
         *
         * @param {boolean} [option.$distinct] if true, returns records that exist in all select statement results (after $execute())
         * @function
         * @memberof cds.Query.prototype
         * @example var sales2015 = sales2010_2015.$intersect(sales2015_2020, {$distinct: true});
         */
        $intersect: intersect,

        /**
         *  Removes the entries from the second query from the first. The queries must have the same number of columns. Additionally the columns must have the same types.
         *
         * @param {boolean} [option.$distinct] if true, returns all unique records from the first select statements after removing the duplicates in the following select statements (after $execute()).
         * @function
         * @memberof cds.Query.prototype
         * @example var sales2010 = sales2010_2011.$except(sales2011, {$distinct: true});
         */
        $except: except
    };
}();

AbstractQuery.Private = {

    /*********************************************************************************
     * Common functions to compute association joins
     *********************************************************************************/


    /* adds joins to the entities, using the name assocName.
     * association is the metadata representation of the association (containing $association).
     * curEntity is the entity which is the source for the navigation (or the target if boolean flag "reverse" is set)
     * alias is the column alias used for referencing the target
     * prevAlias is the column alias used for referencing the source
     *
     */
    addAssociationJoins: function (entities, assocName, association, curEntity, alias, prevAlias, reverse) {

        function replaceAssocAliases(fk, assoc) {
            if (!assoc.$aliases || !assoc.$aliases[fk]) {
                return fk;
            } else {
                return assoc.$aliases[fk];
            }
        }

        function flat(keys, prefix) {
            var res = {};
            for (var key in keys) {
                var newPrefix = prefix ? prefix + "." + key : key;
                if (key.indexOf('$') == 0) {
                    continue;
                }
                if (keys[key].$column) {
                    res[newPrefix] = keys[key];
                } else {
                    var recursive = flat(keys[key], newPrefix);
                    for (var r in recursive) {
                        res[r] = recursive[r];
                    }
                }
            }
            return res;
        }

        if (entities[assocName] || !association.$association) {
            return;
        }
        if (association.$association.$viaEntity) {
            var viaEntity = association.$association.$viaClass;
            var viaAlias = alias + "$viaEntity";
            AbstractQuery.Private.addAssociationJoins(entities, viaAlias, viaEntity.$_mapping[association.$association.$source], viaEntity, prevAlias, viaAlias, true);
            AbstractQuery.Private.addAssociationJoins(entities, assocName, viaEntity.$_mapping[association.$association.$target], viaEntity, assocName, viaAlias);

        } else if (association.$association.$on) {
            var assocRef = assocName.substring(assocName.lastIndexOf(".") + 1);
            var associatedEntity = association.$association.$class;
            entities[assocName] = {
                entity: associatedEntity
            };
            var j = association.$association.$on;
            var matches = j.match(/\$SOURCE(\.\"\w+\")+/g);
            if (matches) {
                for (var k = 0; k < matches.length; k++) {
                    j = j.replace(matches[k], matches[k].replace(/\"\.\"/g, '.'));
                }
            }
            j = j.replace(new RegExp('\\$SOURCE\.\"' + assocRef + '\.', "g"), '"' + alias + '"."');
            j = j.replace(new RegExp('\\$SOURCE', "g"), '"' + prevAlias + '"');
            entities[assocName].joinCond = j;
            entities[assocName].joinType = Query.JoinType.LEFTOUTER;
        } else { //fk association or via backlink
            var associatedEntity = association.$association.$class;
            entities[assocName] = {
                entity: reverse ? curEntity : associatedEntity
            };
            var backlink = association.$association.$viaBacklink;
            var fks = backlink ? associatedEntity.$_mapping[backlink] : association;
            fks = flat(fks);
            for (var fk in fks) {
                if (fk.indexOf("$") === 0) continue;
                var j;
                if (backlink) {
                    j = {
                        _eq: [{
                            _col: [curEntity, replaceAssocAliases(fk, association.$association), prevAlias]
                        }, {
                            _col: [associatedEntity, fks[fk].$column, alias]
                        }]
                    };
                } else {
                    j = {
                        _eq: [{
                            _col: [{
                                $_mapping: association
                            },
                                fk, prevAlias
                            ]
                        }, {
                            _col: [associatedEntity, replaceAssocAliases(fk, association.$association), alias]
                        }]
                    };
                }
                entities[assocName].joinCond = entities[assocName].joinCond ? {
                    _and: [entities[assocName].joinCond, j]
                } : j;
                entities[assocName].joinType = Query.JoinType.LEFTOUTER;
            }
        }
    },


    serializeExpression: function (expr, entityset) {
        if (typeof expr === 'undefined') {
            return undefined;
        }
        if (expr.$_mapping) {
            return expr;
        }
        if (expr.$association) {
            return expr;
        }
        if (Object.prototype.toString.call(expr) === '[object String]') {
            return "'" + expr + "'";
        }
        if (Object.prototype.toString.call(expr) === '[object Date]') {
            var value = expr;
            return "'" + (typeof value === "string" ? value :
                value.getFullYear() + "-" + (value.getMonth() + 1) + "-" + value.getDate() + " " +
                value.getHours() + ":" + value.getMinutes() + ":" + value.getSeconds() + "." +
                value.getMilliseconds()) + "'";
        }
        if (Object.prototype.toString.call(expr) === '[object Array]') {
            return expr.map(function (e) {
                var str = AbstractQuery.Private.serializeExpression(e, entityset);
                return str;
            });
        }
        var notat = expr && expr.notation ? expr.notation : null;
        if (Object.prototype.toString.call(expr) === '[object Object]' && !notat) {
            var prop;
            for (prop in expr) break;
            if (prop && prop.indexOf("_") === 0) {
                notat = Query.F.$notation[prop];
            }
            if (!notat) {
                throw new Error("Unknown operator: " + prop.replace("_", "$") + ". Expected one of: " + Object.keys(Query.F).join(', '));
            }
        }
        if (notat) {
            for (var prop in expr) {
                if (Object.prototype.toString.call(expr[prop]) === '[object Array]') {
                    var str = AbstractQuery.Private.serializeExpression(expr[prop], entityset).concat([entityset]);
                    return notat(str);
                }
            }
        }
        return expr;
    },

    _addJoinEntities: function (entities, cond, alias, firstLevel) {
        for (var key in cond) {
            if (key === '_col') {
                alias = AbstractQuery.Private._addJoinEntities(entities, cond[key][2]._col ? cond[key][2] : undefined, alias);
                var curEntity = cond[key][0];
                var mapping = curEntity.$_mapping ? curEntity.$_mapping : curEntity;
                if (mapping[cond[key][1]] && mapping[cond[key][1]].$association) {
                    AbstractQuery.Private.addAssociationJoins(entities, alias + "." + cond[key][1], mapping[cond[key][1]], curEntity,
                        alias + "." + cond[key][1], alias);
                }
                return alias + "." + cond[key][1];
            } else if (key.indexOf("_") === 0) {
                cond[key].forEach(function (c) {
                    AbstractQuery.Private._addJoinEntities(entities, c, alias, true);
                });
            }
        }
        return alias;
    },

    /* adds all needed join entities for the given condition, starting with alias
     */
    addJoinEntities: function (entities, cond, alias) {
        var result = {};
        for (var p in entities) {
            result[p] = entities[p];
        }
        AbstractQuery.Private._addJoinEntities(result, cond, alias);
        return result;
    },

    transformResult: function(d, metadata) {
        switch (metadata.dataType) {
            case 15: // TIME
                var REGEX_TIME = /(\d{2}):(\d{2}):(\d{2})(\.(\d+))?/;
                var m = d.match(REGEX_TIME);
                if (m) {
                    return new Date(-1, 11, 31, ~~m[1], ~~m[2], ~~m[3], 0);
                } // goto next case otherwise
            case 62: // SECONDDATE
            case 16: // TIMESTAMP
                d = new Date(d);
                //d.setTime(d.getTime() + d.getTimezoneOffset() * 60000);
                return d;
            case 14: // DATE
                d = new Date(d);
                //d.setTime(d.getTime() + d.getTimezoneOffset() * 60000);
                return d;
            case 25: //geospatial datatype
                d = JSON.parse(d.toString());
                return d;
            default:
                return d;
        }
    },


    assembleResultEntry:  function(query, f, rec, config, result, metadata) {
        rec = AbstractQuery.Private.transformResult(rec, metadata);
        var c = result;
        var path = f.split(".");
        if (typeof config === 'undefined' || !config.$flat) {
            for (var k = 1; k < path.length - 1; k++) {
                if (typeof c[path[k]] === 'undefined') {
                    c[path[k]] = {};
                }
                c = c[path[k]];
            }
        }
        if (query.aliasSynonyms && query.aliasSynonyms[f]) {
            c[query.aliasSynonyms[f]] = rec;
        } else {
            if (typeof config === 'undefined' || !config.$flat) {
                c[path[path.length - 1]] = rec;
            } else {
                path.shift();
                c[path.join(".")]= rec;
            }
        }
    },

    recordToObject: function (record, query, config, metadata) {
        var cur = {};
        for (var f in record) {
            if (record[f] === null) {
                continue;
            }
            AbstractQuery.Private.assembleResultEntry(query, f, record[f], config, cur, metadata[f]);
        }
        return cur;
    },

    prepareMetadata: function(metadata) {
        var meta = {};
        if (metadata) {
            for (var m = 0; m < metadata.length; m++) {
                meta[metadata[m].columnDisplayName] = metadata[m];
            }
        }
        return meta;
    },

    recordsToArray: function (records, query, config, metadata) {
        var meta = AbstractQuery.Private.prepareMetadata(metadata);
        var result = [];
        for (var r = 0; r < records.length; r++) {
            result.push(AbstractQuery.Private.recordToObject(records[r], query, config, meta));
        }
        //console.log("records to array in "+(new Date()-start));
        return result;
    },

    paramOrder: function(sqlString, values) {
        var matches = sqlString.match(/\?\/\*\w+\*\//g);
        if (!matches && !values) {
            return [];
        } else if (!matches) {
            return Object.keys(values);
        } else {
            return matches.map(function (m) {
                return m.substring(3, m.length - 2);
            })
        }
    },

    zpad: function(n, digits) {
        var s = n + '';
        while (s.length < digits) {
            s = '0' + s;
        }
        return s;
    },

    transformParams: function(value, type) {
        if (typeof value === 'undefined') {
            return value;
        }
        var zpad = AbstractQuery.Private.zpad;
        switch (type) {
            case 14: // DATE
                return zpad(value.getFullYear(), 4) + "-" + zpad(value.getMonth() + 1, 2) + "-" + zpad(value.getDate(),2);
                break;
            case 15: // TIME
                return zpad(value.getHours(),2) + ":" + zpad(value.getMinutes(),2) + ":" + zpad(value.getSeconds(),2);
                break;
            case 62: // SECONDDATE
                return zpad(value.getFullYear(),4) + "-" + zpad(value.getMonth() + 1, 2) + "-" + zpad(value.getDate(),2) + " " +
                    value.getHours() + ":" + value.getMinutes() + ":" + value.getSeconds();
                break;
            case 16: // TIMESTAMP
                return zpad(value.getFullYear(),4) + "-" + zpad(value.getMonth() + 1, 2) + "-" + zpad(value.getDate(), 2) + " " +
                    zpad(value.getHours(), 2) + ":" + zpad(value.getMinutes(),2) + ":" + zpad(value.getSeconds(), 2) + "." +
                    zpad(value.getMilliseconds(), 3);
                break;
            default:
                return value;
        }
    },

    executePlain: function (q, config, callback) {
        var sqlString;
        try {
            sqlString = q.$sql();
        } catch (e) {
            return callback(e);
        }
        if (sqlString === "") { // NOP
            return callback(null, []);
        }
        transaction.getClient(q.qconn, function (err, conn) {
            conn.prepare(sqlString, function (err, stmt) {
                if (err) {
                    transaction.releaseClient(conn, q.qconn);
                    callback(err);
                } else {
                    var start = new Date();
                    logger.debug("node-cds: execute Query: " + sqlString + (q.values ? " with " + JSON.stringify(q.values) : ""));
                    stmt.exec(AbstractQuery.Private.paramOrder(sqlString, q.values)
                        .filter(function (e) {
                            if (q.values[e]) {
                                return !(q.values[e].$key || q.values[e]._geoPreOp);
                            } else {
                                return true;
                            }
                        }).map(function (e, index) {
                            return AbstractQuery.Private.transformParams(q.values[e], stmt.parameterMetadata[index].dataType);
                        }), function (err, r) {
                        logger.debug("node-cds: query executed in " + (new Date() - start) + "ms");
                        if ((!config || !config.$noCommit) && conn.$_autoCommit) {
                            conn.commit(function(err) {
                                transaction.releaseClient(conn, q.qconn);
                                callback(err, r, stmt.resultSetMetadata)
                            });
                        } else {
                            transaction.releaseClient(conn, q.qconn);
                            callback(err, r, stmt.resultSetMetadata)
                        }
                    });
                }
            });
        });
    },

    executePlainAndStream: function (q, config, callback) {

        function formatStream(metadata) {
            var transform = new Transform( { objectMode: true } );
            transform._transform = function(data, encoding, done) {
                this.push(AbstractQuery.Private.recordToObject(data, q, config, metadata));
                done();
            }
            return transform;
        }

        var sqlString = q.$sql();
        if (sqlString === "") { // NOP
            return callback(null, []);
        }
        transaction.getClient(q.qconn, function (err, conn) {
            if (err)
                return callback(err);
            conn.execute(sqlString, function (err, rs) {
                transaction.releaseClient(conn, q.qconn);
                callback(err, rs.createObjectStream()
                    .on('end', function () {
                        if (!rs.closed) {
                            rs.close();
                        }
                    }).on('error', function () {
                        if (!rs.closed) {
                            rs.close();
                        }
                    }).pipe(formatStream(AbstractQuery.Private.prepareMetadata(rs.metadata))));
            });
        });
    },

    executeAndPreFormat: function (query, config, callback) {

        if (!config || !config.$stream) {
            AbstractQuery.Private.executePlain(query, config, function (err, records, metadata) {
                if (err) {
                    callback(err);
                } else {
                    var result;
                    if (records) {
                        result = AbstractQuery.Private.recordsToArray(records, query, config, metadata);
                    }
                    callback(null, result);
                }
            });
        } else {
            AbstractQuery.Private.executePlainAndStream(query, config, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, result);
                }
            });
        }
    },


    normalizeExecuteCallParams: function(query, conn, config, callback) {
        if (!conn || Object.prototype.toString.call(conn.connect) !== '[object Function]') {
            callback = config;
            config = conn;
            conn = query.qconn;
        } else {
            query.qconn = conn;
        }
        if (!config || Object.prototype.toString.call(config) === '[object Function]') {
            callback = config;
            config = undefined;
        }
        return {callback: callback, config: config};
    }
};


/*********************************************************************************
 * SetQuery constructor
 *********************************************************************************/

function SetQuery(client, subQuery1, setOperator, subQuery2, entities, leadingAlias, aliasSynonyms) {
    AbstractQuery.call(this, client, entities, leadingAlias, aliasSynonyms);
    this.subQuery1 = subQuery1;
    this.setOperator = setOperator;
    this.subQuery2 = subQuery2;
}

SetQuery.prototype = function () {
    function sql() {
        var specifications = "";
        if (this.orderby) {
            specifications += " ORDER BY " + this.orderby.map(function (o) {
                    var ob = AbstractQuery.Private.serializeExpression(o.by, this.entities);
                    return (Object.prototype.toString.call(ob) === '[object String]' ? ob.replace('\".\"', '.') : ob) + " " + o.asc + " " + o.nulls;
                }, this).join(", ");
        }
        if (this.limit) {
            specifications += " LIMIT " + this.limit.limit + (this.limit.offset ? " OFFSET " + this.limit.offset : "");
        }
        return this.subQuery1.$sql() + this.setOperator + this.subQuery2.$sql() + specifications;
    }

    function execute(conn, config, callback) {
        var params = AbstractQuery.Private.normalizeExecuteCallParams(this, conn, config, callback);
        this.qconn = params.conn;
        return AbstractQuery.Private.executeAndPreFormat(this, params.config, params.callback);
    }

    function copy(e) {
        var result = new SetQuery(e.qconn, e.subQuery1, e.setOperator, e.subQuery2, e.entities, e.leadingAlias, e.aliasSynonyms);
        result.type = e.type;
        result.orderby = e.orderby;
        result.limit = e.limit;
        return result;
    }

    function limit(limit, offset) {
        var result = copy(this);
        result.limit = {
            limit: limit,
            offset: offset
        };
        return result;
    }

    function orderby() {
        var startAlias = this.leadingAlias;
        var result = copy(this);
        var args = Array.prototype.slice.call(arguments, 0);
        result.orderby = args.map(function (o) {
            result.entities = AbstractQuery.Private.addJoinEntities(result.entities, o.$by, startAlias);
            if (typeof o.$nullsLast === 'undefined') {
                o.$nullsLast = o.$desc; // default of SQL spec
            }
            return {
                by: o.$by,
                asc: o.$desc ? 'DESC' : 'ASC',
                nulls: o.$nullsLast ? 'NULLS LAST' : 'NULLS FIRST'
            };
        });
        return result;
    }

    var proto = new AbstractQuery();

    /**
     * Returns a new set query which is equivalent to the called query, but with an additional ordering specification.
     * The order is specified using a number of criteria passed to the operator as arguments.
     * @param {object} criterion_i:  An object {$by: <expr> [, $desc: true|false] [, $nullsLast: true|false]}, where $by
     * specifies an expression (following the syntax of $where) or is a column number. If $desc is set to true the order of the
     * returned result set is in descending order, otherwise it is in ascending order. If $nullsLast is set to true, null values
     * are at the end of the result set, if it is false they are at the beginning. If $nullsLast is not set, the default of SQL is
     * taken (depending on ascending/descending order).
     *
     * WARNING: The columns used in <expr> must belong to the query first added to the set (see example).
     * Additionally after either $order or $limit has been used set operations ($union, $intersect, $except) can not be used.
     * @function
     * @memberof cds.Query.prototype
     * @returns {cds.Query} a new query which performs the aggregation
     * @example
     *      // correct
     *      sales2013.$union(sales2014).$order({$by: SALES2013.amount});
     *
     *      // will throw exception once executed
     *      sales2013.$union(sales2014).$order({$by: SALES2014.amount});
     *
     *      // will throw exception once executed
     *      sales2013.$order({$by: SALES2013.amount}).$union(sales2014);
     * @type {orderby}
     */
    proto.$order = orderby;

    /**
     * Returns a new query which is equivalent to the called query, but includes
     * a LIMIT n, m specification, i.e. will return the first n result records, and skip m results
     * @param {number} n the number of result set elements which should be returned
     * @param {?number} m the offset i.e. the number of skipped rows
     * @returns {cds.Query} a new query with the limit specification added
     * @function
     * @memberof cds.Query.prototype
     * @example soHeader.$query().$limit(10, 5).$execute({}, function(err, res) {});
     */
    proto.$limit = limit,

    /** returns the SQL string represented by the query object.
     * @returns {string} the query string represented by the query object
     * @function
     * @memberof cds.Query.prototype
     */
        proto.$sql = sql;

    /**
     * Executes the query and transforms the result back into the structure imposed by the CDS/XSDS metadata.
     *
     * @function
     * @memberof cds.Query.prototype
     */
    proto.$execute = execute;
    return proto;
}();

function Query(client, entities, leadingAlias) {
    AbstractQuery.call(this, client, entities, leadingAlias, {});
}

Query.prototype = function () {


    /*********************************************************************************
     * Handling Projections
     *********************************************************************************/

    /* recursively adds all columns of the mapping to result object
     */
    function addAllColumns(result, m) {
        for (var f in m) {
            if (f.indexOf("$") > -1) continue;
            if (!m[f].$column) {
                result[f] = {};
                addAllColumns(result[f], m[f]);
            } else {
                result[f] = true;
            }
        }
        return result;
    }

    /* recursively merges projection specs result and proj into result
     */
    function merge(result, proj, mapping) {
        if (proj.$all) {
            addAllColumns(result, mapping);
        }
        for (var f in proj) {
            if (f==="$all") continue;
            if (!result[f]) {
                result[f] = proj[f];
            }
            if (proj[f] === false) {
                delete(result[f]);
            }
            if (result[f] && proj[f]) {
                var m = mapping[f].$association ? mapping[f].$association.$class.$_mapping : mapping[f];
                result[f] = merge(result[f], proj[f]===true ? {$all:true} : proj[f], m);
            }
        }
        return result;
    }

    /* called by defaultProject to compute the default projection path
     */
    function defaultProjectionPath(startAliases) {
        startAliases = startAliases || [this.leadingAlias];
        var r = {};
        var that = this;
        startAliases.forEach(function (a) {
            r[a] = {};
            var entity = that.entities[a].entity;
            if (entity) {
                addAllColumns(r[a], entity.$_mapping);
            }
        });
        return r;
    }

    function projectionPath(assocOrStruct) {
        var r = {};
        var mapping;
        if (assocOrStruct.$association) {
            mapping = assocOrStruct.$association.$class.$_mapping;
        } else {
            mapping = assocOrStruct;
        }
        addAllColumns(r, mapping);
        return r;
    }

    /* see docu of $defaultProject
     */
    function defaultProject(startAliases) {
        return this.$project(defaultProjectionPath.call(this, startAliases));
    }


    function navigationIsLocal(projPart, entityDefPart) {
        for (var p in projPart) {
            if (!(p in entityDefPart)) return false;
        }
        return true;
    }

    /* called by project, recursively processes navigation expressions. writes results to res.
     * uses path expression proj, prefix is the already processes prefix in dot notation,
     * curEntity the currently processed entity
     * tableAlias the alias of the current entity
     * aliasSynonyms the current synonym mapping which is modified
     * query the query object
     * delimiter the next path delimiter to be used for computing the alias
     */
    function processNavigation(res, proj, prefix, curEntity, tableAlias, aliasSynonyms, query, delimiter, considerFalse) {
        var entities = query.entities;
        if (proj.$all) {
            var mapping = curEntity.$_mapping ? curEntity.$_mapping : curEntity;
            proj = merge({}, proj, mapping);
        }
        for (var p in proj) {
            var alias = prefix + delimiter + p;
            if (typeof proj[p] !== 'undefined'
                && (Object.prototype.toString.call(proj[p]) !== '[object Object]')) {
                // end of navigation path reached
                if (curEntity.$column) {
                    throw new Error("Error in processing navigation expression: " + p
                        + " is not an association or field. " + prefix + " already refers to a field");
                }
                var next = curEntity.$_mapping ? curEntity.$_mapping[p] : curEntity[p];
                if (!next) {
                    throw new Error("Error in processing navigation expression: " + p);
                }
                if (!next.$column) {
                    AbstractQuery.Private.addAssociationJoins(entities, alias, next, curEntity, alias, tableAlias);
                    if (next.$association) { // we end up in an association and expand it
                        processNavigation(res, projectionPath(next), alias, next.$association.$class,
                            alias, aliasSynonyms, query, ".");
                    } else { // we end up in a struct and expand it
                        processNavigation(res, projectionPath(next), alias, next,
                            tableAlias, aliasSynonyms, query, ".");
                    }
                } else { // we end up in a proper column
                    res.push({
                        alias: alias,
                        field: (tableAlias + p) === alias ? p : alias.substr(tableAlias.length + 1),
                        entity: curEntity,
                        tableAlias: tableAlias
                    });
                    if (typeof proj[p] === 'string') {
                        if (proj[p].match(/^\w*$/) === null) {
                            throw new Error('String ' + proj[p] + ' is not a valid alias for ' + p);
                        }
                        aliasSynonyms[alias] = proj[p];
                    } else if (proj[p] === false) {
                        aliasSynonyms[alias] = false;
                    }
                }
            } else { // navigate further
                if (curEntity.$_mapping && !curEntity.$_mapping[p]) {
                    throw new Error("Error in processing navigation expression: " + p
                        + " is not an association in " + curEntity.$_metadata.entityName);
                }
                var association = curEntity.$_mapping ? curEntity.$_mapping[p] : curEntity[p];
                if (association.$association && !navigationIsLocal(proj[p], association)) {
                    AbstractQuery.Private.addAssociationJoins(entities, alias, association, curEntity, alias, tableAlias);
                    processNavigation(res, proj[p], alias,
                        association.$association.$class,
                        prefix + "." + p, aliasSynonyms, query, ".");
                } else {
                    processNavigation(res, proj[p], alias,
                        association, tableAlias, aliasSynonyms, query, ".");
                }

            }
        }
    }

    function validColumnName(s) {
        var parts = s.split('"');
        parts = parts.filter(function (e) {
            return e !== ""
        });
        return parts.map(function (s) {
                return s.match(/^(((\.?[\w,\:]+)+)|\.|\"|(\'\'))$/)
            }).filter(function (e) {
                return e === null
            }).length === 0;
    }

    /* does the project, writes into result */
    function doProject(orig, result, p, startAliases, considerFalse) {
        result.projection = [];
        if (typeof p === 'string') {
            if (!validColumnName(p)) {
                throw new Error(p + " is not a valid column name");
            }
            result.projection.push(p);
        } else {
            if (!startAliases) {
                startAliases = Object.keys(p);
            }
            var processedForLeadingAlias = false;
            for (var k = 0; k < startAliases.length; k++) {
                var startAlias = startAliases[k];
                var path;
                if (orig.entities[startAlias] && p[startAlias]) {
                    // explicit start alias
                    path = p[startAlias];
                } else {
                    // fallback to leading alias
                    if (processedForLeadingAlias) continue; // avoid duplicates when falling back to leading alias
                    startAlias = orig.leadingAlias;
                    path = p;
                    processedForLeadingAlias = true;
                }
                if (orig.entities[startAlias].entity) {
                    processNavigation(result.projection, path, startAlias, orig.entities[startAlias].entity, startAlias, result.aliasSynonyms, result, ".");
                }
            }
        }
    }


    /* see docu of $project
     */
    function project(p, startAliases) {
        var result = copy(this);
        try {
            doProject(this, result, p, startAliases);
        } catch (e) {
            return errorQuery(e);
        }
        return result;
    }

    /*********************************************************************************
     * Handling Selections
     *********************************************************************************/


    /* see docu of $where
     */
    function where(cond) {
        var result = copy(this);
        result.selection = this.selection ? {
            _and: [cond, this.selection]
        } : cond;
        result.entities = AbstractQuery.Private.addJoinEntities(this.entities, cond, this.leadingAlias);
        return result;
    }

    function isNumberOrString(val) {
        return Object.prototype.toString.call(val) === "[object String]"
            || Object.prototype.toString.call(val) === "[object Number]"
            || Object.prototype.toString.call(val) === "[object Boolean]"
            || Object.prototype.toString.call(val) === "[object Int64]";
    }

    /* transforms a template templ to a condition
     */
    function transformToCondition(templ, entity, mapping, entities, ref) {

        function subCondForOperator(val, prop) {
            var subCond = {};
            if (isNumberOrString(val)) {
                subCond["_" + prop.substring(1)] = [ref, val];
            } else if (Object.prototype.toString.call(val) === "[object Date]") {
                subCond["_" + prop.substring(1)] = [ref, AbstractQuery.Private.transformParams(val, entity.$_metadata.sqlMetadata[mapping.$column].$type)];
            } else if (val._parId){
                subCond["_" + prop.substring(1)] = [ref, val];
            } else if (Object.prototype.toString.call(val) === "[object Object]") {
                var cond = transformToCondition(val, entity, mapping, entities, ref);
                cond = cond.map(function(c) {
                    return {_and: [c, {_null: [c._eq[0], false]}]}; // IS NOT NULL for each equality check to cope with SQL NULL
                })
                cond = (cond.length>1) ? {_and: cond} : cond
                if (prop == "$eq") {
                    return cond;
                } else if (prop == "$ne") {
                    return {_not : [cond]};
                } else {
                    throw new Error("Error in matching clause: Object value of " + prop + " only allowed for $eq, $neq");
                }
            } else {
                throw new Error("Error in matching clause: Value of " + prop + " must be a String, Number, Boolean or Date, or operator must be $eq or $neq");
            }
            return subCond;
        }

        function subCondForLiteral(literal, prop) {
            var subCond = {};
            subCond._eq = [{
                _col: [{
                    $_mapping: mapping
                },
                    prop, ref
                ]
            },
                literal
            ];
            return subCond;
        }

        function subCondForDateLiteral(literal, prop) {
            var subCond = {};
            var revAttributeMapping;
            for (var attribute in entity.$_metadata.revMapping) {
                if (entity.$_metadata.revMapping[attribute] == prop) {
                    revAttributeMapping = attribute;
                }
            }
            subCond._eq = [{
                _col: [{
                    $_mapping: mapping
                },
                    prop, ref
                ]
            },
                AbstractQuery.Private.transformParams(templ[prop], entity.$_metadata.sqlMetadata[revAttributeMapping].$type)
            ];
            return subCond;
        }

        function subCondForAssocNull(nextTempl, mapping, ref) {
            var subConds = [];
            var nextMapping = mapping[prop];
            var n;
            for (var fk in nextMapping) {
                if (nextMapping.hasOwnProperty(fk) && fk.substring(0, 1) !== "$") {
                    var reference = {
                        _col: [{
                            $_mapping: nextMapping
                        },
                            fk, ref
                        ]
                    };
                    var r;
                    if (typeof nextMapping[fk].$none !== 'undefined') {
                        r = {_eq: [reference, nextMapping[fk].$none]};
                    } else {
                        r = {_null: [reference]};
                    }
                    n = !n ? r : {_and: [n, r]};
                }
            }
            if (!nextTempl.$null) {
                n = {_not: [n]};
            }
            subConds.push(n);
            return subConds;
        }

        function keysNull(entity, ref) {
            var n;
            var mapping = entity.$_mapping;
            for (var k in mapping) {
                if (mapping.hasOwnProperty(k) && mapping[k].$key) {
                    var reference = {
                        _col: [entity, k, ref]
                    };
                    var r = {_null: [reference]};
                    n = !n ? r : {_and: [n, r]};
                }
            }
            return n;
        }

        function subCondForGeospatialType(entity, geoObj, colName) {
            var subCond = {};

                if(!geoObj._geoPreOp) {
                    if(geoObj.$eq) {
                        geoObj = geoObj.$eq;
                        if (geoObj.type) { //geoObj is a geoJSON-Obj
                            var geo = require('./cds-queries-geo');
                            switch(geoObj.type) {
                                case "Point":
                                    geoObj = geo.stPoint(geoObj);
                                    break;
                                case "MultiPoint":
                                    geoObj = geo.stMultiPoint(geoObj);
                                    break;
                                case "LineString":
                                    geoObj = geo.stLineString(geoObj);
                                    break;
                                case "CircularString":
                                    geoObj = geo.stCircularString(geoObj);
                                    break;
                                case "MultiLineString":
                                    geoObj = geo.stMultiLineString(geoObj);
                                    break;
                                case "Polygon":
                                    geoObj = geo.stPolygon(geoObj);
                                    break;
                                case "MultiPolygon":
                                    geoObj = geo.stMultiPolygon(geoObj);
                                    break;
                                case "GeometryCollection":
                                    geoObj = geo.stGeometryCollection(geoObj);
                                    break;
                                default:
                                    //TODO error
                                    break;
                            }
                        }
                    }
                }

                subCond._eq = [{
                    _postOp: [
                        "ST_EQUALS",
                        [{
                            _col: [entity, colName, entity]
                        },
                            geoObj]
                    ]
                },
                    1
                ];

            return subCond;
        }


        var result = [];
        for (var prop in templ) {
            if (!templ.hasOwnProperty(prop) || prop === "$association") {
                continue; // ignore this
            } else if (prop === '$empty' || prop === "$none") {
                var sub = subCondForOperator(templ[prop], prop);
                sub._empty = [keysNull(entity, ref), sub._empty[1]];
                result.push(sub);
            } else if (prop === "$using" || prop === "$entity") {
                // ignore
            } else if (prop.substring(0, 1) === '$') {
                result.push(subCondForOperator(templ[prop], prop));
            } else if (!mapping[prop]) {
                throw new Error("Error in matching clause: " + prop + " not found in " + entity.$_metadata.entityName);
            } else if (isNumberOrString(templ[prop])) {
                result.push(subCondForLiteral(templ[prop], prop));
            } else if (Object.prototype.toString.call(templ[prop]) === "[object Date]") {
                result.push(subCondForDateLiteral(templ[prop], prop));
            } else if (entity.$_metadata.sqlMetadata[prop] != undefined && entity.$_metadata.sqlMetadata[prop].$csType === 103) {
                result.push(subCondForGeospatialType(entity, templ[prop], prop));
            } else { // nested property
                var nextEntity;
                var nextMapping;
                var foreignKeyAccess = Object.prototype.toString.call(templ[prop]) === "[object Object]"
                    && Object.keys(templ[prop]).filter(function (t) {
                        return !(t in mapping[prop]);
                    }).length === 0; // i.e. we follow an association but only local foreign keys are accessed

                if (mapping[prop].$association && !foreignKeyAccess) {
                    nextEntity = mapping[prop].$association.$class;
                    nextMapping = nextEntity.$_mapping;
                } else {
                    nextEntity = entity;
                    nextMapping = mapping[prop];
                }
                var reference = foreignKeyAccess ? ref : {
                    _col: [{
                        $_mapping: mapping
                    },
                        prop, ref
                    ]
                };
                var subConds;
                var nextTempl = templ[prop];
                if (mapping[prop].$association && nextTempl
                    && typeof(nextTempl.$null) !== "undefined"
                    && (nextTempl.$null === true || nextTempl.$null === false)) { //handle the case where assocs are requested to be null
                    subConds = subCondForAssocNull(nextTempl, mapping, ref);
                } else {
                    subConds = transformToCondition(nextTempl, nextEntity, nextMapping, entities, reference);
                }
                for (var k = 0; k < subConds.length; k++) {
                    result.push(subConds[k]);
                }

            }
        }
        return result;
    }

    /* produces a condition from dot references to structured
     */
    function eliminateDots(template, mapping) {
        var result = {};
        for (var prop in template) {
            var path = prop.split(".");
            var p = result;
            for (var i = 0; i < path.length - 1; i++) {
                if (!p[path[i]]) {
                    p[path[i]] = {};
                }
                p = p[path[i]];
            }
            p[path[path.length - 1]] = template[prop];
        }
        return result;
    }

    /* see docu of $matching
     */
    function matching(template) {

        if (!template) {
            return this;
        }
        if (Object.prototype.toString.call(template) != '[object Object]') {
            throw new Error("Structured object expected as input to $matching");
        }

        var entity = this.entities[this.leadingAlias].entity;
        template = eliminateDots(template, entity.$_mapping);
        try {
            var conds = transformToCondition(template, entity, entity.$_mapping, this.entities, this.leadingAlias);
        } catch (e) {
            return errorQuery(e);
        }
        var cond;
        for (var k = 0; k < conds.length; k++) {
            cond = cond ? {
                _and: [cond, conds[k]]
            } : conds[k];
        }
        if (cond) {
            return this.$where(cond);
        } else {
            return this;
        }
    }

    /*********************************************************************************
     * Handling of other CDS-QL functions
     *********************************************************************************/


    function join(entity, cond, type) {
        var result = copy(this);
        var startAlias;
        var startEntity;
        if (entity.alias) { // we have a reference to an entity
            startAlias = entity.alias;
            startEntity = entity.entity;
        } else { // we have a plain entity
            var i = 0;
            var shortName = entity.$_metadata.entityName.substring(entity.$_metadata.entityName.lastIndexOf(".") + 1);
            while (typeof result.entities[shortName + i] !== 'undefined') {
                i++;
            }
            startAlias = shortName + i;
            startEntity = entity;
        }
        // result.entities = addJoinEntities(result.entities, cond, this.leadingAlias);
        result.entities[startAlias] = {
            entity: startEntity,
            joinCond: cond,
            joinType: type ? type : Query.JoinType.INNER
        };
        // result.entities = addJoinEntities(result.entities, cond, entity.alias);
        return result;
    }

    function distinct(dist) {
        var result = copy(this);
        result.distinct = (typeof dist === 'undefined') ? true : dist;
        return result;
    }

    function summarize(by, agg, optionsAsText) {
        var startAlias = this.leadingAlias;

        if (Object.prototype.toString.call(by) !== '[object Array]') {
            by = [by];
        }

        var result = copy(this);
        var entitiesObj = {};
        for (var e in result.entities) {
            entitiesObj[e] = result.entities[e];
        }
        result.entities = entitiesObj;
        var that = this;
        result.groupby = {
            clauses: [],
            optionsAsText: optionsAsText
        };
        result.groupby.clauses = by.map(function (g) {
            doProject(that, result, g, startAlias, true);
            return result.projection;
        });
        var pMap = {};
        result.groupby.clauses.forEach(function (g) {
            g.forEach(function (g0) {
                if (!pMap[g0.alias]) {
                    pMap[g0.alias] = g0;
                }
            });
        });
        result.projection = [];
        result.aliasSynonyms = [];
        for (var p in pMap) {
            if (typeof this.aliasSynonyms[p] === 'undefined' || this.aliasSynonyms[p] !== false) {
                result.projection.push(pMap[p]);
            }
        }

        var aggs = [];
        for (var a in agg) {
            aggs.push({
                alias: a,
                field: agg[a],
                tableAlias: startAlias,
                entity: result.entities[startAlias].entity
            });
        }
        result.projection = result.projection.concat(aggs);
        result.entities = AbstractQuery.Private.addJoinEntities(result.entities, agg, startAlias);
        return result;
    }

    function having(having) {
        var startAlias = this.leadingAlias;
        var result = copy(this);
        var that = this;
        result.having = having;
        return result;
    }

    function orderby() {
        var startAlias = this.leadingAlias;
        var result = copy(this);
        var args = Array.prototype.slice.call(arguments, 0);
        result.orderby = args.map(function (o) {
            result.entities = AbstractQuery.Private.addJoinEntities(result.entities, o.$by, startAlias);
            if (typeof o.$nullsLast === 'undefined') {
                o.$nullsLast = o.$desc; // default of SQL spec
            }
            return {
                by: o.$by,
                asc: o.$desc ? 'DESC' : 'ASC',
                nulls: o.$nullsLast ? 'NULLS LAST' : 'NULLS FIRST'
            };
        });
        return result;
    }

    function limit(limit, offset) {
        var startAlias = this.leadingAlias;
        var result = copy(this);
        result.limit = {
            limit: limit,
            offset: offset
        };
        return result;
    }


    function add(addtl, bindObj) {
        var result = copy(this);
        var startAlias = this.leadingAlias;
        if (!result.projection) {
            result = result.$defaultProject();
        }
        for (var a in addtl) {
            result.projection.push({
                alias: a,
                field: addtl[a],
                tableAlias: startAlias,
                entity: result.entities[startAlias].entity
            });
            if (bindObj) {
                bindObj[a] = Query.F.$col(undefined, a);
            }
            result.entities = AbstractQuery.Private.addJoinEntities(result.entities, addtl[a], startAlias);
        }
        return result;
    }

    /*********************************************************************************
     * DML
     *********************************************************************************/

    function valuesRec(values, resValues, mapping, isFlexible) {
        for (var v in values) {
            if (!mapping) {
                resValues[v] = values[v]; // simplified in case of sub queries, only select case
            } else {
                if (typeof mapping[v] != 'undefined' && mapping[v].$column || isFlexible) {
                    resValues[mapping[v].$column] = values[v];
                } else if (typeof mapping[v] != 'undefined') {
                    valuesRec(values[v], resValues, mapping[v], isFlexible); // recursion for structured values
                }
                // ignore value as not expected
            }
        }
        return resValues;
    }

    function values(values) {
        var result = copy(this);
        var entity = this.entities[this.leadingAlias];
        result.values = {};
        valuesRec(values, result.values, entity.entity ? entity.entity.$_mapping : null, entity.entity ? entity.entity.$_metadata.isFlexible : false, "");
        return result;
    }

    function dml(q, values) {
        if (values) {
            return q.$values(values);
        } else {
            return copy(q);
        }
    }

    function insert(values) {
        var q = dml(this, values);
        q.type = Query.QueryType.INSERT;
        return q;
    }

    function discard() {
        var q = copy(this);
        q.type = Query.QueryType.DELETE;
        return q;
    }

    function upsert(values) {
        var q = dml(this, values);
        q.type = Query.QueryType.UPSERT;
        return q;
    }

    function update(values) {
        var q = dml(this, values);
        q.type = Query.QueryType.UPDATE;
        return q;
    }

    /*********************************************************************************
     * Copy for internal usage
     *********************************************************************************/

    function copy(e) {
        var result = new Query(e.qconn, e.entities);
        result.type = e.type;
        result.selection = e.selection;
        result.projection = e.projection;
        result.aliasSynonyms = e.aliasSynonyms;
        result.top = e.top;
        result.values = e.values;
        result.groupby = e.groupby;
        result.having = e.having;
        result.leadingAlias = e.leadingAlias;
        result.orderby = e.orderby;
        result.limit = e.limit;
        result.distinct = e.distinct;
        result.error = e.error;
        result.syncExecute = e.syncExecute;
        return result;
    }

    /******************************************************************************
     * Query Serialization Functions
     ******************************************************************************/

    function serializeCondition(expr, entityset, source, target) {
        if (typeof expr === 'string') {
            var matches = expr.match(/(\$SOURCE|\$TARGET)(\.\"\w+\")+/g);
            if (matches) {
                for (var k = 0; k < matches.length; k++) {
                    expr = expr.replace(matches[k], matches[k].replace(/\"\.\"/g, '.'));
                }
                if (source) {
                    expr = expr.replace(/\$SOURCE/g, '"' + source + '"');
                }
                if (target) {
                    expr = expr.replace(/\$TARGET/g, '"' + target + '"');
                }
            }
            return expr;
        } else {
            return AbstractQuery.Private.serializeExpression(expr, entityset);
        }
    }

    function toArray(entities) {
        var result = [];
        for (var e in entities) {
            if (entities[e].entities) { // a subquery
                result.push({entity: entities[e], alias: e});

            } else {
                result.push({
                    entity: entities[e].entity ? entities[e].entity : entities[e],
                    join: entities[e].joinCond,
                    joinType: entities[e].joinType,
                    alias: e
                });
            }
        }
        return result;
    }

    function columnSpecs(vals, entity) {
        var result = [];
        for (var v in vals) {
            var m = entity.$_mapping;
            var p = v.split(".");
            for (var k = 0; k < p.length; k++) {
                m = m[p[k]];
            }
            if (!m.$column) {
                continue; // ignore
            }
            result.push('"' + m.$column + '"');
        }
        return result;
    }

    function serializeProject(sql, noalias) {
        return sql.projection.map(function (e) {
            if (typeof e === 'string') {
                var p = e.split(".");
                var alias = p[p.length - 1];
                if (alias[0] === '"' && alias[alias.length - 1] === '"') {
                    alias = alias.substring(1, alias.length - 1);
                }
                return e + ' AS "' + alias + '"';
            } else {
                if (typeof e.field != 'string') {
                    return AbstractQuery.Private.serializeExpression(e.field, sql.entities) + (noalias ? "" : ' AS "' + e.alias + '"');
                } else {
                    var fieldPath = e.field.split(".");
                    if (!e.entity.$_mapping) {
                        return '"' + e.tableAlias + '"."' + e.entity[fieldPath[fieldPath.length - 1]].$column + (noalias ? '"' : '" AS "' + e.alias + '"');
                    }
                    var field = e.entity.$_mapping;
                    for (var i = 0; i < fieldPath.length; i++) {
                        field = field[fieldPath[i]];
                    }
                    if (!field || !field.$column) {
                        throwError("Error during query building: " + e.field + " is not a field in "
                            + e.entity.$_metadata.entityName);
                    }


                    //test if column is geospatial
                    var geospatial = '';
                    if (e.entity.$_metadata.sqlMetadata[field.$column].$csType === 103) {
                        geospatial = '.ST_AsGeoJSON()';
                    }

                    return '"' + e.tableAlias + '"."' + field.$column + '"' + geospatial + (noalias ? '': ' AS "' + e.alias + '"');
                }
            }
        }).join(", ");
    }

    function serializeFrom(sql) {
        return " FROM " + toArray(sql.entities).reduce(function (prev, e) {
                if (e.join) {
                    var from = prev[prev.length - 1];
                    from += " " + e.joinType;
                    from += " JOIN " + printTableName(e.entity.$_metadata ? e.entity.$_metadata.tableName : e.entity) + ' "' + e.alias + '" ON '
                        + serializeCondition(e.join, sql.entities, sql.leadingAlias, e.alias);
                    prev[prev.length - 1] = from;
                } else if (e.entity.$_metadata) {
                    prev.push(printTableName(e.entity.$_metadata.tableName) + ' "' + e.alias + '"');
                } else if (e.entity.entities) { // subquery
                    prev.push("(" + e.entity.$sql(true) + ') AS "' + e.alias + '"');
                } else {
                    prev.push(e.entity + ' "' + e.alias + '"');
                }
                return prev;
            }, []).join(", ");
    }


    function serializeGroupBy(sql) {
        return (sql.groupby && sql.groupby.clauses.length > 0 ? " GROUP BY GROUPING SETS "
            + (sql.groupby.optionsAsText ? sql.groupby.optionsAsText : "") + "("
            + sql.groupby.clauses.map(function (e) {
                return "(" + e.map(function (e0) {
                        return '"' + e0.tableAlias + '"."' + e0.entity.$_mapping[e0.field].$column + '"';
                    }).join(", ") + ")";
            }).join(", ") + ")" : "")
            + (sql.having ? " HAVING " + AbstractQuery.Private.serializeExpression(sql.having, sql.entities) : "")
            + (sql.orderby ? " ORDER BY " + sql.orderby.map(function (o) {
                return AbstractQuery.Private.serializeExpression(o.by, sql.entities) + " " + o.asc + " " + o.nulls;
            }).join(", ") : "");
    }

    function serializeSelect(sql, noalias) {
        return sql.type + " " + (sql.limit && sql.groupby ? "TOP " + sql.limit.limit + " " : '') + (sql.distinct ? " DISTINCT " : "")
            + serializeProject(sql, noalias) + serializeFrom(sql)
            + (sql.selection ? " WHERE " + serializeCondition(sql.selection, sql.entities) : "")
            + serializeGroupBy(sql) + (sql.limit && !sql.groupby ? " LIMIT " + sql.limit.limit
            + (sql.limit.offset  ? " OFFSET " + sql.limit.offset : "") : "")
            + (sql.values ? "/*"+JSON.stringify(sql.values)+"*/" : "");
    }

    function placeholders(sql) {
        var placeholders = [];
        if (sql.values) {
            for (var v in sql.values) {
                if (sql.values[v] && sql.values[v]._geoPreOp) {
                    var argumentString = sql.values[v]._geoPreOp[0] + '(';
                    for (var i = 1; i < sql.values[v]._geoPreOp.length; i++) {
                        argumentString += typeof sql.values[v]._geoPreOp[i] === 'string' ? '\'' + sql.values[v]._geoPreOp[i] + '\'' : sql.values[v]._geoPreOp[i];
                        if (i != sql.values[v]._geoPreOp.length-1) {argumentString += ', '}
                    }
                    argumentString += ')';
                    placeholders.push(argumentString);
                }
                else if (sql.values[v] && sql.values[v].$key) {
                    placeholders.push('"'+sql.values[v].$key+'".NEXTVAL');
                }
                else {
                    placeholders.push("?");
                }
            }
        }
        return placeholders;
    }

    function printTableName(name) {
        return '"' + name + '"';
    }

    function serializeInsert(sql) {
        var entity = toArray(sql.entities)[0].entity;
        return sql.type + " INTO " + printTableName(entity.$_metadata.tableName)
            + " (" + columnSpecs(sql.values, entity).join(", ") + ") VALUES (" + placeholders(sql).join(", ") + ")";
    }

    function serializeUpsert(sql) {
        var entity = toArray(sql.entities)[0];
        return sql.type + " " + printTableName(entity.entity.$_metadata.tableName)
            + " (" + columnSpecs(sql.values, entity.entity).join(", ") + ") VALUES (" + placeholders(sql).join(", ") + ")"
            + (sql.selection ? " WHERE " + AbstractQuery.Private.serializeExpression(sql.selection, sql.entities).replace(new RegExp('"' + entity.alias + '"\.', "g"), '') : " WITH PRIMARY KEY");
    }

    function serializeDelete(sql) {
        var entity = toArray(sql.entities)[0];
        return sql.type + " FROM " + printTableName(entity.entity.$_metadata.tableName) + ' "' + entity.alias + '" '
            + (sql.selection ? " WHERE " + AbstractQuery.Private.serializeExpression(sql.selection, sql.entities) : "");
    }

    function serializeUpdate(sql) {
        var entity = toArray(sql.entities)[0];
        return sql.type + " " + printTableName(entity.entity.$_metadata.tableName) + ' "' + entity.alias + '" SET '
            + columnSpecs(sql.values, entity.entity).map(function (c) {
                return c + " = ?";
            }).join(", ")
            + (sql.selection ? " WHERE " + AbstractQuery.Private.serializeExpression(sql.selection, sql.entities) : "");
    }

    function sql(noalias) {
        var sql = this;
        if (!sql.projection) {
            sql = sql.$defaultProject();
        } else if (sql.projection.length===0) {
            return ""; // NOP
        }
        if (sql.type === Query.QueryType.SELECT) {
            return serializeSelect(sql, noalias);
        } else if (sql.type === Query.QueryType.DELETE) {
            return serializeDelete(sql);
        } else {
            if (!sql.values || Object.keys(sql.values).length===0) {
                return ""; // NOP
            }
            if (sql.type === Query.QueryType.INSERT) {
                return serializeInsert(sql);
            } else if (sql.type === Query.QueryType.UPSERT) {
                return serializeUpsert(sql);
            } else if (sql.type === Query.QueryType.UPDATE) {
                return serializeUpdate(sql);
            }
        }
        return null;
    }

    /*********************************************************************************
     * Query execution
     *********************************************************************************/

    var generatedKeyCount;

    function getStructureAndAddKeys(path, query) {
        var structure = {};
        structure.table = path[path.length - 1];
        structure.children = [];
        structure.putInArray = true;
        structure.aggregateResultSet = true;
        var ent = query.entities[path.slice(0, path.length - 1).join('.')];
        if (path.length > 1) {
            if (!ent) {
                structure.aggregateResultSet = false;
                structure.putInArray = false;
            } else {
                var association = ent.entity.$_mapping[path[path.length - 1]].$association;
                if (association) {
                    structure.putInArray = '$viaBacklink' in association || '$on' in association;
                    if ('$source' in association && '$target' in association) {
                        structure.putInArray = true;
                        structure.aggregateResultSet = !query.entities[path.join('.') + "$viaEntity"].entity.$_metadata.isUnmanaged;
                    }
                } else {
                    structure.aggregateResultSet = false;
                    structure.putInArray = false;
                }
            }
        }

        var keyFilterFunction = function (proj) {
            return proj.tableAlias === joinedPath && proj.field === key.name;
        };
        var foreignKeyFilterFunction = function (proj) {
            return proj.tableAlias === joinedPath + '.' + foreignPropertyPath && proj.field === foreignPropertyName;
        };

        if (structure.aggregateResultSet) {
            structure.keys = [];
            structure.generatedKeys = [];
            var joinedPath = path.join('.');
            if (query.entities[joinedPath]) {
                for (var prop in query.entities[joinedPath].entity.$_metadata.keyFields) {
                    var key = {name: prop};
                    structure.keys.push(key);
                    if (prop.indexOf('.') == -1) {
                        key.generated = query.projection.filter(keyFilterFunction).length === 0;
                        if (key.generated) {
                            structure.generatedKeys.push(prop);
                            generatedKeyCount++;
                            query.projection.push({
                                alias: joinedPath + '.' + prop,
                                field: prop,
                                tableAlias: joinedPath,
                                entity: query.entities[joinedPath].entity
                            });
                        }

                    } else {
                        var foreignPropteryFullPath = prop.split('.');
                        var foreignPropertyName = foreignPropteryFullPath.pop();
                        var foreignPropertyPath = foreignPropteryFullPath.join('.');

                        key.generated = query.projection.filter(foreignKeyFilterFunction).length === 0;
                        if (key.generated) {
                            structure.generatedKeys.push(prop);
                            generatedKeyCount++;
                            query.projection.push({
                                alias: joinedPath + '.' + prop,
                                field: foreignPropertyPath + '.' + foreignPropertyName,
                                tableAlias: joinedPath,
                                entity: query.entities[joinedPath].entity
                            });
                        }
                    }
                }
            }
        }

        var children = [];
        for (var i = 0; i < query.projection.length; i++) {
            var newPath = query.projection[i].tableAlias.split('.');
            if (newPath.length > path.length) {
                var equal = true;
                for (var j = 0; j < path.length; j++) {
                    equal &= newPath[j] === path[j];
                }
                if (equal && children.indexOf(newPath[path.length]) == -1) {
                    children.push(newPath[path.length]);
                    structure.children.push(getStructureAndAddKeys(path.concat(newPath[path.length]), query));
                }
            }
        }
        return structure;
    }

    function getObject(records, path, arrayPosition, structure) {
        var object = records[arrayPosition];
        for (var i = 0; i < path.length; i++) {
            object = object[path[i]];
        }
        var result = {};
        for (var prop in object) {
            if (!structure.aggregateResultSet || structure.generatedKeys.indexOf(prop) == -1) {
                result[prop] = object[prop];
            }
        }
        return result;
    }

    function TreeNode(table, keys) {
        this.children = {};
        this.childrenSortArrays = {};
        this.table = table;
        this.keys = keys;
        this.arrayPosition = -1;
    }

    TreeNode.prototype.addAll = function (records, structure) {
        for (var i = 0; i < records.length; i++) {
            this.add(records[i], structure, i);
        }
    };

    TreeNode.prototype.add = function (element, structure, arrayPosition) {
        if (!(structure.table in this.children)) {
            this.children[structure.table] = {aggregatable: [], sortArray: [], nonAggregatable: []};
        }

        var child;
        var keys = {};
        if (structure.aggregateResultSet) {
            var containsNull = false;
            for (var i = 0; i < structure.keys.length; i++) {
                var path = structure.keys[i].name.split(".");
                keys[structure.keys[i].name] = element;
                for (var j = 0; j < path.length; j++) {
                    if (keys[structure.keys[i].name] && typeof keys[structure.keys[i].name] == 'object' && path[j] in keys[structure.keys[i].name]) {
                        keys[structure.keys[i].name] = keys[structure.keys[i].name][path[j]];
                    } else {
                        keys[structure.keys[i].name] = null;
                        break;
                    }
                }
                containsNull |= ((keys[structure.keys[i].name]===null) || (typeof keys[structure.keys[i].name]==='undefined')) ;
            }

            if (containsNull) {
                child = new TreeNode(structure.table, keys);
                this.children[structure.table].nonAggregatable.push(child);
            } else {
                child = this._searchChild(structure.table, keys, [0, this.children[structure.table].aggregatable.length - 1]);
            }
        } else {
            child = -1;
        }

        if (typeof child == 'number') {
            this.children[structure.table].sortArray.splice(child, 0, this.children[structure.table].aggregatable.length);
            child = new TreeNode(structure.table, keys);
            this.children[structure.table].aggregatable.push(child);
        }
        child.arrayPosition = arrayPosition;
        for (var k = 0; k < structure.children.length; k++) {
            if (structure.children[k].table in element) {
                child.add(element[structure.children[k].table], structure.children[k], arrayPosition);
            }
        }
    };

    TreeNode.prototype.mergeChildren = function () {
        for (var table in this.children) {
            this.children[table] = this.children[table].aggregatable.concat(this.children[table].nonAggregatable);
            for (var i = 0; i < this.children[table].length; i++) {
                this.children[table][i].mergeChildren();
            }
        }
    };

    TreeNode.prototype.applyAll = function (records, structure) {
        var resultArray = [];
        if (structure.table in this.children) {
            for (var i = 0; i < this.children[structure.table].length; i++) {
                var child = this.children[structure.table][i];
                resultArray.push(getObject(records, [], child.arrayPosition, structure));
                for (var j = 0; j < structure.children.length; j++) {
                    var childStructure = structure.children[j];
                    if (childStructure.table in child.children) {
                        if (childStructure.putInArray) {
                            resultArray[resultArray.length - 1][childStructure.table] = [];
                            for (var k = 0; k < child.children[childStructure.table].length; k++) {
                                resultArray[resultArray.length - 1][childStructure.table].push(child.children[childStructure.table][k].apply(records, childStructure, [childStructure.table]));
                            }
                        } else {
                            resultArray[resultArray.length - 1][childStructure.table] = child.children[childStructure.table][0].apply(records, childStructure, [childStructure.table]);
                        }
                    }
                }
            }
        }
        return resultArray;
    };

    TreeNode.prototype.apply = function (records, structure, path) {
        var result = getObject(records, path, this.arrayPosition, structure);
        for (var i = 0; i < structure.children.length; i++) {
            var childStructure = structure.children[i];
            var childPath = path.concat(childStructure.table);
            if (childStructure.putInArray) {
                result[childStructure.table] = [];
                if (this.children[childStructure.table]) {
                    for (var j = 0; j < this.children[childStructure.table].length; j++) {
                        result[childStructure.table].push(this.children[childStructure.table][j].apply(records, childStructure, childPath));
                    }
                }
            } else if (typeof this.children[childStructure.table] !== 'undefined') {
                result[childStructure.table] = this.children[childStructure.table][0].apply(records, childStructure, childPath);
            }
        }
        return result;
    };

    /**
     * Searches for the child with the given table and keys.
     *
     *  @return {TreeNode|integer} The child or an integer specifiyng where the child should be inserted to keep the array sorted.
     */
    TreeNode.prototype._searchChild = function (table, keys, sliceIndices) {
        if (this.children[table].aggregatable.length === 0) {
            return 0;
        }
        var middleChild = this.children[table].aggregatable[this.children[table].sortArray[sliceIndices[0] + Math.floor((sliceIndices[1] - sliceIndices[0]) / 2)]];

        var sgn = 0;
        for (var keyName in keys) {
            if (keys[keyName] < middleChild.keys[keyName]) {
                sgn = -1;
                break;
            } else if (keys[keyName] > middleChild.keys[keyName]) {
                sgn = 1;
                break;
            }
        }

        if (sgn !== 0) {
            var newSliceIndices;
            if (sgn === -1) {
                newSliceIndices = [sliceIndices[0], sliceIndices[0] + Math.floor((sliceIndices[1] - sliceIndices[0]) / 2)];
            } else {
                newSliceIndices = [sliceIndices[0] + Math.floor((sliceIndices[1] - sliceIndices[0]) / 2), sliceIndices[1]];
            }

            if (newSliceIndices[1] - newSliceIndices[0] === 0) {
                return sgn === -1 ? newSliceIndices[0] : newSliceIndices[0] + 1;
            } else if (sliceIndices[1] - sliceIndices[0] === 1) {
                if (sgn === -1) {
                    return newSliceIndices[0];
                } else {
                    return this._searchChild(table, keys, [newSliceIndices[1], newSliceIndices[1]]);
                }
            } else {
                return this._searchChild(table, keys, newSliceIndices);
            }
        } else {
            return middleChild;
        }
    };

    function execute(conn, config, callback) {
        var query = this;
        var params = AbstractQuery.Private.normalizeExecuteCallParams(query, conn, config, callback);
        callback = params.callback;
        config = params.config;
        if (config && config.$factorized && !config.$flat && !config.$stream) {
            query = !query.projection ? query.$defaultProject() : query;
            generatedKeyCount = 0;
            var structure = getStructureAndAddKeys(['t0'], query);
            AbstractQuery.Private.executeAndPreFormat(query, config, function (err, records) {
                if (err) {
                    callback(err);
                } else {
                    query.projection.splice(-generatedKeyCount, generatedKeyCount);
                    var treeNode = new TreeNode();
                    treeNode.addAll(records, structure);
                    treeNode.mergeChildren();
                    records = treeNode.applyAll(records, structure);
                    callback(null, records);
                }
                //console.log("factorize in "+(new Date()-start));

            });
        } else {
            return AbstractQuery.Private.executeAndPreFormat(query, config, callback);
        }
    }

    function executeProm(config) {
        var query = this;
        return new Promise(function (fulfill, reject) {
            execute(query, config, function (err) {
                reject(err);
            }, function (res) {
                fulfill(res);
            });
        });
    }


    /*********************************************************************************
     * Public XS Query interface
     *********************************************************************************/

    var proto = new AbstractQuery();

    /** Returns a new query which is equivalent to the called query, but which contains only those column values
     * reachable through the specified path specification. The projection ignores (i.e. overrides) the projection
     * in the original query.
     * @function
     * @memberof cds.Query.prototype
     *
     * @param {object} pathSpec a JavaScript object which follows in its structure the expected
     * result object structure. A navigation a.b.c following associations a and b and
     * referring to a field c is represented by a JavaScript
     * object {a: {b: {c: true}}}. The value true can also be any string expression, which
     * results in an alias in the result set. It is also possible to
     * merge several path expressions into one path specification, such as
     * {a: {b1: {c1: true}, b2: {c2: true}}} corresponding to the path
     * expressions a.b1.c1 and a.b2.c2.
     * @returns {cds.Query} a new query with the projection specification added to the query
     * @example SOHeader.$query().$project({
     *               SALESORDERID: true,
     *               NETAMOUNT: "TotalNet",
     *               items: {
     *                   NETAMOUNT: true
     *               }
     *           }).$execute({}, function(err, result) {});
     *     // example result:
     *     //   [{   "SALESORDERID": "0500000236",
     *     //        "TotalNet": 273.9,
     *     //        "items": {
     *     //             "NETAMOUNT": 29.9
     *     //         }
     *     //    }]
     */
    proto.$project = project;

    /** Returns a new query which is equivalent to the called query, but replaces
     * any projection specification by the default projection. The default projection
     * specifies all fields of the entitiy without following associations.
     * @returns {cds.Query} a new query with the default projection specification added to the query
     * @function
     * @memberof cds.Query.prototype
     * @example soHeader.$query().$defaultProject();
     * // example result:
     * //       {
     * //           DELIVERYSTATUS: "I",
     * //           BILLINGSTATUS: "I",
     * //           LIFECYCLESTATUS: "X",
     * //           TAXAMOUNT: "52.04",
     * //           TotalNet: "273.9",
     * //           GROSSAMOUNT: "325.94",
     * //           CURRENCY: "EUR",
     * //           PARTNERID: "0100000044",
     * //           HISTORY: {
     * //               CHANGEDAT: "2012-05-13T22:00:00.000Z",
     * //               CHANGEDBY: "0000000033",
     * //               CREATEDAT: "2012-04-29T22:00:00.000Z",
     * //               CREATEDBY: "0000000033"
     * //           },
     * //           SALESORDERID: "0500000486"
     * //       }
     */
    proto.$defaultProject = defaultProject;

    /** Returns a new query which is equivalent to the called query, but includes a
     * selection condition cond specified using an expression API.
     * @param cond A Boolean expression specified as follows: An expression is either <ul><li>a column reference constructed using e.f
     * where e is an entity and f is a field of e as defined in the entity definition. </li>
     * <li>a column reference following an association path using e.assoc1,assoc2....f.</li>
     * <li>a function application to an expression e, for instance e.$plus(5).
     * All functions which can be applied are specified in the {@linkn cds.Expr}</li>
     * <li>a Javascript literal</li></ul>
     * A Boolean expression is either<ul>
     * <li>e.$eq(e0), if e and e0 are expressions (representing the SQL equality operator), similar for the operators $gt, $lt, $ge, $le, $ne representing the SQL operators</li>
     * <li>e.$and(e0) if e and e0 are Boolean expressions (representing the SQL AND operator)</li>
     * <li>e.$or(e0) if e and e0 are Boolean expressions (representing the SQL OR operator)</li>
     * <li>e.$null (representing the SQL IS NULL operator)</li>
     * <li>e.$infixOp(sqlop, e0) if e and e0 are expressions and sqlop is a SQL infix operator.
     * <li>e.$prefixOp(sqlOp, e0,...,en) if e, e0,...,en are expressions and sqlop is a SQL prefix operator</li>
     * </li></ul>
     * For a full overview on all possible operators constructing a boolean expression, see {@link cds.Expr}
     *
     * Note, that due to JavaScript pecularities, the association or property names "name", "prototype", "length", "caller" need to be escaped by a $ sign.
     * So in order to refer to an entity property "name" in E, you need to write E.$name
     * @returns {cds.Query} a new query with the selection specification added to the query
     * @function
     * @memberof cds.Query.prototype
     * @example var qSelectedOrders = soHeader.$query().$project({
     *       SALESORDERID: true,
     *       NETAMOUNT: "TotalNet",
     *       items: {
     *           NETAMOUNT: true
     *       }
     *   }).$where(soHeader.items.NETAMOUNT.$div(soHeader.NETAMOUNT).$gt(0.5))
     *
     * // example result:
     * //   [{
     * //           SALESORDERID: "0500001005",
     * //           TotalNet: "273.9",
     * //           items: {
     * //               NETAMOUNT: "780"
     * //       }]
     */
    proto.$where = where;

    /**Returns a new query which is equivalent to the called query, but includes a
     * selection condition which is equivalent to the template specified as argument.
     * @param template is an object following the result set structure
     * together with values specifying the allowed values of the result set.
     * For a complete account of the syntax of template, see {{cds.Entity#$find}.
     * @returns {cds.Query} a new query with the selection specification added to the query
     * @function
     * @memberof cds.Query.prototype
     * @example qSelectedOrders = soHeader.$query().$limit(1).$project({
     *           SALESORDERID: true,
     *           NETAMOUNT: "TotalNet",
     *           items: {
     *               NETAMOUNT: true
     *           }
     *       }).$matching({
     *           items: {
     *               CURRENCY: 'EUR',
     *               QUANTITY: {
     *                   $gt: 2
     *               }
     *           }
     *       });
     *
     * // example result:
     * // [{
     * //       SALESORDERID: "0500000236",
     * //       TotalNet: "273.9",
     * //       items: {
     * //           NETAMOUNT: "87"
     * //       }
     * // }]
     */
    proto.$matching = matching;

    /**
     * Returns a new query which is equivalent to the called query, but with an additional GROUP BY section and
     * a restricted projection clause based on the pathSpec object.
     * @param {object} pathSpec A path expression as described in the desciption of the $project operator. pathSpec will lead to the
     * GROUP BY clause of the generated query. In addition, the projection is overridden with the same clause. It is possible
     * to hide some parts of the pathSpec, so that they appear in the GROUP BY clause but not in the projection: for this, the
     * pathSpec property needs be terminated with the constant false (instead of true or a String literal).
     * @memberof cds.Query.prototype
     * @returns {cds.Query} a new query which performs the aggregation
     * @function
     * @example soItem.$query().$limit(2).$aggregate({
     *      SALESORDERID: true,
     *      PRODUCTID: true
     * }).$addFields({
     *      averageQuantity: soItem.QUANTITY.$avg()
     * }).$execute({}, function(err, result) {});
     *
     * // example result:
     * // [{
     * //     PRODUCTID: "HT-1107",
     * //     averageQuantity: "1"
     * // },
     * // {
     * //     PRODUCTID: "HT-1072",
     * //     averageQuantity: "3"
     * // }]
     */
    proto.$aggregate = summarize;

    proto.$having = having;


    /**
     * Returns a new query which is equivalent to the called query, but with an additional ordering specification.
     * The order is specified using a number of criteria passed to the operator as arguments.
     * @param {object} criterion_i:  An object {$by: <expr> [, $desc: true|false] [, $nullsLast: true|false]}, where $by
     * specifies an expression (following the syntax of $where) or is a column number. If $desc is set to true the order of the
     * returned result set is in descending order, otherwise it is in ascending order. If $nullsLast is set to true, null values
     * are at the end of the result set, if it is false they are at the beginning. If $nullsLast is not set, the default of SQL is
     * taken (depending on ascending/descending order).
     * @memberof cds.Query.prototype
     * @returns {cds.Query} a new query which performs the aggregation
     * @function
     * @example soHeader.$query().$limit(2).$project({
     *       SALESORDERID: true,
     *       NETAMOUNT: "TotalNet",
     *       items: {
     *           NETAMOUNT: true
     *       }
     *   }).$order({
     *       $by: soHeader.NETAMOUNT,
     *       $desc: true
     *   }, {
     *       $by: soHeader.items.NETAMOUNT
     *   }).$execute({}, function(err, result) {});
     */
    proto.$order = orderby;

    /**
     * Returns a new query which is equivalent to the called query, but includes
     * a LIMIT n, m specification, i.e. will return the first n result records, and skip m results
     * @param {number} n the number of result set elements which should be returned
     * @param {?number} m the offset i.e. the number of skipped rows
     * @returns {cds.Query} a new query with the limit specification added
     * @function
     * @memberof cds.Query.prototype
     * @example soHeader.$query().$limit(10, 5).$execute({}, function(err, result) {});
     */
    proto.$limit = limit;
    proto.$distinct = distinct;

    /**
     * Returns a new query which is equivalent to the called query, but with additional calculated fields
     * in the projection clause as specified in newFields.
     * @param {object} newFields An object {p_0: expr_0, ... p_n: expr_n}. Each property p: expr of
     * newFields results in one new field p added to the projection clause of the query.
     * The value expr must be an expression as specified in the description of the $where clause.
     * @memberof cds.Query.prototype
     * @returns {cds.Query} a new query with the specified field added to the projection
     * @function
     * @example SOHeader.$query().$limit(10).$project({
     *     SALESORDERID: true,
     *     NETAMOUNT: "TotalNet",
     *     items: {
     *         NETAMOUNT: true
     *     }
     * }).$addFields({
     *     "DaysAgo": soHeader.items.DELIVERYDATE.$prefixOp("DAYS_BETWEEN", new Date())
     * }).$execute({}, function(err, result) {});
     *
     * // example result:
     * // [{
     * //    SALESORDERID: "0500000486",
     * //    TotalNet: "273.9",
     * //    items: {
     * //        NETAMOUNT: "87"
     * //    },
     * //    DaysAgo: 681
     * // }]
     */
    proto.$addFields = add;

    proto.$join = join;

    /* creates a query which updates the rows specified as arguments or handed
     * over via the $values method
     * @param values the values to be updated, using a map of entity properties
     * of the first entity
     * @function
     */
    proto.$update = update;

    /* creates a query which upserts the rows specified as arguments or handed
     * over via the $values method
     * @param values the values to be upserted, using a map of entity properties
     * of the first entity
     */
    proto.$upsert = upsert;

    /* creates a query which inserts the rows specified as arguments or handed
     * over via the $values method
     * @param values the values to be inserted, using a map of entity properties
     * of the first entity
     */
    proto.$insert = insert;

    /* creates a query which deletes rows in the first entity which fulfil
     * the where clause
     */
    proto.$discard = discard;

    /* sets the values for later update, upsert, or insert.
     * @param values an object mapping entity properties to values for modification
     */
    proto.$values = values;

    /** returns the SQL string represented by the query object.
     * @returns {string} the query string represented by the query object
     * @function
     * @memberof cds.Query.prototype
     */
    proto.$sql = sql;

    /**
     * Executes the query and transforms the result back into the structure imposed by the CDS/XSDS metadata.
     *
     * @param {Object}  [config] specifies the appearance of the result set. If this value is not set or empty,
     * a structured result set is returned, i.e. the result set is delivered as an array or array-like object of rows, each of which
     * contains an object. That object contains the local fields of the entity and as subobjects the requested values by association.
     * @param {boolean} [config.$flat] if true, returns the data as delivered by the database as an array or array-like object of rows,
     *                  each of which contains an object with the field (column) names as properties
     * @param {boolean} [config.$factorized] if true, summarizes the result set based on the object's key(s).</br>
     *              Example: [{id: 1, 1_m_association: 0}, {id: 1, 1_m_association: 1}] -> [{id: 1, 1_m_association: [0, 1]}]
     * @function
     * @memberof cds.Query.prototype
     * @example SOHeader.$query().$project({SALESORDERID: true}).$execute({}, function(err, result) {});
     *      // example result:
     *      //  [{
     *      //    "SALESORDERID": "0500000486",
     *      //    "items": {
     *      //        "NETAMOUNT": "87"
     *      //    }
     *      //   }, {
     *      //    "SALESORDERID": "0500000486",
     *      //    "items": {
     *      //        "NETAMOUNT": "29.9"
     *      //    }
     *      //   }]
     *
     *      SOHeader.$query().$project({SALESORDERID: true}).$execute({$factorized: true}, function(err, result) {});
     *      // example result:
     *      // [{"SALESORDERID":"0500000486",
     *      //      "items":[
     *      //           {"NETAMOUNT":"87"},
     *      //           {"NETAMOUNT":"29.9"}
     *      //      ]
     *      // }]
     *
     *      result = SOHeader.$query().$project({SALESORDERID: true}).$execute({$flat: true}, function(err, result) {});
     *      // example result:
     *      //  [{
     *      //    "SALESORDERID": "0500000486",
     *      //    "items.NETAMOUNT": "87"
     *      //   },
     *      //   {
     *      //    "SALESORDERID": "0500000486",
     *      //    "items.NETAMOUNT": "29.9"
     *      //   }
     *      //]
     *      //
     */
    proto.$execute = execute;

    return proto;

}();

/*********************************************************************************
 * Expression functions
 *********************************************************************************/

/** @class Expr
 * @memberof cds
 */
Query.F = function () {

    function naryInfix(op) {
        return function (args) {
            return args.filter(function (a) {
                return typeof(a) === 'string' || typeof(a) === 'number';
            }).map(function (a) {
                return "(" + a + ")";
            }).join(op);
        };
    }

    function binaryInfix(op) {
        return function (args) {
            return args.filter(function (a) {
                return typeof(a) === 'string' || typeof(a) === 'number';
            }).map(function (a) {
                return "(" + a + ")";
            }).join(op);
        };
    }


    function binaryInfixNoParens(op) {
        return function (args) {
            return args[0] + op + args[1];
        };
    }

    function unaryPrefix(op) {
        return function (args) {
            return op + "(" + args[0] + ")";
        };
    }


    var notation = {
        _eq: binaryInfixNoParens("="),
        _ne: binaryInfixNoParens("!="),
        _gt: binaryInfixNoParens(">"),
        _lt: binaryInfixNoParens("<"),
        _ge: binaryInfixNoParens(">="),
        _le: binaryInfixNoParens("<="),
        _times: naryInfix("*"),
        _plus: naryInfix("+"),
        _minus: binaryInfix("-"),
        _div: binaryInfix("/"),
        _null: function (args) {
            var negated = !args[1];
            return args[0] + " IS " + (negated ? "NOT" : "") + " NULL ";
        },
        _empty: function (args) {
            var negated = !args[1];
            return (negated ? "NOT " : "") + "(" + args[0] + ")";
        },
        _avg: function (args) {
            return "AVG(" + args[0] + ")";
        },
        _count: function (args) {
            return "COUNT(" + args[0] + ")";
        },
        _max: function (args) {
            return "MAX(" + args[0] + ")";
        },
        _min: function (args) {
            return "MIN(" + args[0] + ")";
        },
        _sum: function (args) {
            return "SUM(" + args[0] + ")";
        },
        _like: function (args) {
            return args[0] + " LIKE " + args[1];
        },
        _unlike: function (args) {
            return args[0] + " NOT LIKE " + args[1];
        },
        _and: naryInfix(" AND "),
        _or: naryInfix(" OR "),
        _not: function (args) {
            return " NOT (" + args[0] + ")";
        },
        _infixOp: function (args) {
            return args[0] + " " + args[1].substring(1, args[1].length - 1) + " " + args[2];
        },
        _prefixOp: function (args) {
            args.pop();
            var op = args[1].substring(1, args[1].length - 1);
            var a = [args[0]];
            args.shift();
            args.shift();
            a = a.concat(args);
            return op + " (" + a.join(", ") + ") ";
        },
        _preOp: function(args) {
            args.pop();
            var op = args[0].substring(1, args[0].length - 1);
            var a = [args[1]];
            args.shift();
            args.shift();
            a = a.concat(args);
            return op + " (" + a.join(", ") + ") ";
        },
        _geoPreOp: function(args) {
            args.pop();
            var op = args[0].substring(1, args[0].length - 1);
            var a = [args[1]];
            args.shift();
            args.shift();
            a = a.concat(args);
            return op + " (" + a.join(", ") + ") ";
        },
        _postOp: function(args) {
            args.pop();
            var op = args[0].substring(1, args[0].length - 1);
            var a = args[1];
            if (Object.prototype.toString.call(a) === '[object Array]') {
                args = a;
                a=args[0];
            } else {
                args.shift();
            }
            args.shift();
            return " " + a + "." + op + "(" +args.join(", ") + ")";
        },
        _parId: function(args) {
            return "?/*"+args[0].substring(1, args[0].length-1)+"*/";
        },
        _col: function (args) {

            function getAlias(entity, entityset) {
                for (var e in entityset) {
                    if (entity === entityset[e].entity) {
                        return '"' + e + '"';
                    }
                }
                return null;
            }

            var fieldname = args[1].substring(1, args[1].length - 1);
            var posDot = fieldname.indexOf('.');
            if (!args[0]) {
                return '"' + fieldname + '"'; // for references to added fields, which do not have a qualification
            }
            var fieldspec;
            var mapping = args[0].$_mapping;
            if (!mapping) {
                fieldspec = fieldname;
            } else if (posDot < 0) {
                fieldspec = mapping[fieldname];
            } else {
                fieldspec = mapping[fieldname.substring(0, posDot)];
                fieldspec = fieldspec[fieldname.substring(posDot + 1)];
            }
            var via = args[2];
            if (typeof via === 'string' && via.substring(0, 1) !== '"') {
                via = '"' + via.substring(1, via.length - 1) + '"';
            }
            var entityset = args[args.length - 1];
            var prefix = (typeof via === 'string') ? via.split('"."').join(".") : getAlias(args[2], entityset);
            if (!fieldspec) {
                return via.substring(0, via.length - 1) + "." + fieldname + '"';
            } else if (fieldspec.$column) {
                return prefix + '."' + fieldspec.$column + '"';
            } else {
                return prefix + '."' + fieldname + '"';
            }
        }
    };

    var fct = function (name, notation, typecheck) {
        return function () {
            var result = {
                notation: notation
            };
            if (arguments.length > 0 && Object.prototype.toString.call(arguments[0]) === '[object Array]') {
                result[name] = arguments[0];
            } else {
                result[name] = (Array.prototype.slice.call(arguments, 0));
            }

            function defineFunction(p, obj) {
                obj[p] = function () {
                    return Query.F[p]([result].concat(Array.prototype.slice.call(arguments)));
                };
            }

            for (var p in Query.F) {
                defineFunction(p, result);
            }

            if (name === "_col") {
                var e = arguments[0];
                if (typeof e === 'string') {
                    return result;
                }
                var field = arguments[1];
                var fieldPrefix = field.substring(0, field.indexOf('.')) || field;
                if (e) {
                    var mapping = e.$_mapping;
                    if (!mapping[fieldPrefix]) {
                        throw "Error during query construction: Field or association " + fieldPrefix + " does not exist in " + e.$_metadata.entityName;
                    }
                    if (mapping[fieldPrefix].$association) {
                        var targetEntity = mapping[fieldPrefix].$association.$class;
                        if (targetEntity.$_mapping) {
                            for (var f in targetEntity.$_mapping) {
                                var createColFct;
                                createColFct = function (ff, prefix) {
                                    Object.defineProperty(result, ff, {
                                        get: function () {
                                            return Query.F.$col(targetEntity, ff, result);
                                        },
                                        set: function (value) {
                                        },
                                        configurable: true
                                    });
                                };
                                createColFct(f);
                            }
                        }
                        for (var fk in mapping[fieldPrefix]) {
                            if (fk.substring(0, 1) === '$') continue;
                            var createColFct = function (ff) {
                                Object.defineProperty(result, ff, {
                                    get: function () {
                                        return Query.F.$col({
                                            $_mapping: mapping[fieldPrefix]
                                        }, ff, result._col[2]);
                                    },
                                    set: function (value) {
                                    }
                                });
                            };
                            createColFct(fk);
                        }
                    }
                }
            }
            return result;
        };
    };

    return {

        /** constructs an expression to be used in $where, $addFields, or $order representing the equality of two expressions
         * @memberof cds.Expr
         * @function
         * @example soHeader.$query().$where(soHeader.NETAMOUNT.$eq(0))
         */
        $eq: fct("_eq", notation["_eq"]),


        /** constructs an expression to be used in $where, $addFields, or $order representing the greater-than relation between two expressions
         * @memberof cds.Expr
         * @function
         * @example soHeader.$query().$where(soHeader.NETAMOUNT.$gt(10))
         */
        $gt: fct("_gt", notation["_gt"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing the less-than relation between two expressions
         * @memberof cds.Expr
         * @function
         * @example soHeader.$query().$where(soHeader.NETAMOUNT.$lt(10))
         */
        $lt: fct("_lt", notation["_lt"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing the not-equal relation between two expressions
         * @memberof cds.Expr
         * @function
         * @example soHeader.$query().$where(soHeader.DELIVERYSTATUS.$ne("I"))
         */
        $ne: fct("_ne", notation["_ne"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing the less-than-or-equal relation between two expressions
         * @memberof cds.Expr
         * @function
         * @example soHeader.$query().$where(soHeader.NETAMOUNT.$le(10))
         */
        $le: fct("_le", notation["_le"]),


        /** constructs an expression to be used in $where, $addFields, or $order representing the greater-than-or-equal relation between two expressions
         * @memberof cds.Expr
         * @function
         * @example soHeader.$query().$where(soHeader.NETAMOUNT.$ge(10))
         */
        $ge: fct("_ge", notation["_ge"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing the addition of two expressions
         * @memberof cds.Expr
         * @function
         * @example soHeader.$query().$addFields({"added10": soHeader.NETAMOUNT.$plus(10)})
         */
        $plus: fct("_plus", notation["_plus"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing the subtraction of two expressions
         * @memberof cds.Expr
         * @function
         * @example soHeader.$query().$addFields({"minus10": soHeader.NETAMOUNT.$minus(10)})
         */
        $minus: fct("_minus", notation["_minus"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing the multiplication of two expressions
         * @memberof cds.Expr
         * @function
         * @example soHeader.$query().$addFields({"times10": soHeader.NETAMOUNT.$times(10)})
         */
        $times: fct("_times", notation["_times"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing the division of two expressions
         * @memberof cds.Expr
         * @function
         * @example soHeader.$query().$addFields({"dividedBy10": soHeader.NETAMOUNT.$div(10)})
         */
        $div: fct("_div", notation["_div"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing that an expression is equal to null. If an additional argument "false" is given the expression states
         * that the first expression is not null.
         * @memberof cds.Expr
         * @function
         * @example soHeader.$query().$where(soHeader.BILLINGSTATUS.$null()) // generates: ... WHERE "t0"."BILLINGSTATUS" IS NULL
         * @example soHeader.$query().$where(soHeader.BILLINGSTATUS.$null(false)) // generates: ... WHERE "t0"."BILLINGSTATUS" IS NOT NULL
         */
        $null: fct("_null", notation["_null"]),

        $empty: fct("_empty", notation["_empty"]),


        /** constructs an expression to be used in $where, $addFields, or $order representing that the first expression argument is NOT LIKE the second expression argument
         * @memberof cds.Expr
         * @function
         * @example soHeader.$query().$where(soHeader.CURRENCY.$unlike("%UR"))
         */
        $unlike: fct("_unlike", notation["_unlike"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing that the first expression argument is LIKE the second expression argument
         * @memberof cds.Expr
         * @function
         * @example soHeader.$query().$where(soHeader.CURRENCY.$like("%UR"))
         */
        $like: fct("_like", notation["_like"]),


        /** constructs an expression to be used in $where, $addFields, or $order representing that all boolean expression arguments should hold
         * @memberof cds.Expr
         * @function
         * @example soHeader.$query().$where(soHeader.NETAMOUNT.$lt(10).$and(soHeader.DELIVERYSTATUS.$eq("I")))
         */
        $and: fct("_and", notation["_and"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing that one of boolean expression arguments should hold
         * @memberof cds.Expr
         * @function
         * @example soHeader.$query().$where(soHeader.NETAMOUNT.$lt(10).$or(soHeader.DELIVERYSTATUS.$eq("I")))
         */
        $or: fct("_or", notation["_or"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing that the given boolean expression should not hold
         * @memberof cds.Expr
         * @function
         *
         * @example soHeader.$query().$where(soHeader.NETAMOUNT.$lt(10).$and(soHeader.DELIVERYSTATUS.$eq("I").$not()))
         * // generates ... WHERE ("t0"."NETAMOUNT"<10) AND ( NOT "t0"."DELIVERYSTATUS"='I')
         */
        $not: fct("_not", notation["_not"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing the average function application on an expression
         * @memberof cds.Expr
         * @function
         * @example var averageQuantity = soItem.$query().$aggregate({
         *      SALESORDERID: true,
         *      PRODUCTID: true
         * }).$addFields({
         *      averageQuantity: soItem.QUANTITY.$avg()
         * })
         */
        $avg: fct("_avg", notation["_avg"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing the maximum function application on an expression
         * @memberof cds.Expr
         * @function
         * @example var maximalQuantity = soItem.$query().$aggregate({
         *      SALESORDERID: true,
         *      PRODUCTID: true
         * }).$addFields({
         *      maximalQuantity: soItem.QUANTITY.$max()
         * })
         */
        $max: fct("_max", notation["_max"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing the minimum function application on an expression
         * @memberof cds.Expr
         * @function
         * @example var minimalQuantity = soItem.$query().$aggregate({
         *      SALESORDERID: true,
         *      PRODUCTID: true
         * }).$addFields({
         *      minimalQuantity: soItem.QUANTITY.$min()
         * })
         */
        $min: fct("_min", notation["_min"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing the sum function application between two expressions
         * @memberof cds.Expr
         * @function
         * @example var sumOfNetAmounts = soItem.$query().$aggregate({
         *      SALESORDERID: true,
         *      PRODUCTID: true
         * }).$addFields({
         *      sumOfNetAmounts: soItem.NETAMOUNT.$sum()
         * })
         */
        $sum: fct("_sum", notation["_sum"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing the count function application between two expressions
         * @memberof cds.Expr
         * @function
         * @example var ctOfProdIts = = soItem.$query().$aggregate({
         *      PRODUCTID: true
         * }).$addFields({
         *      countOfProdIDs: soItem.PRODUCTID.$count()
         * })
         */
        $count: fct("_count", notation["_count"]),

        /* constructs a field reference expression, referencing a field f in Entity e
         * @param {Entity} e the entity containing the field
         * @param {string} f the field name in e to be referenced
         * @memberof cds.Expr
         * @function
         */
        $col: fct("_col", notation["_col"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing an infix operation specified as first argument
         * @memberof cds.Expr
         * @function
         * @example soHeader.$query().$where(soHeader.CURRENCY.$infixOp("LIKE", "%UR"))// generated: ...WHERE "t0"."CURRENCY" LIKE '%UR'",
         */
        $infixOp: fct("_infixOp", notation["_infixOp"]),

        /** constructs an expression to be used in $where, $addFields, or $order representing a prefix operation specified as first argument
         * @memberof cds.Expr
         * @function
         * @example soHeader.$query().$addFields({
         *      "DaysAgo": soHeader.items.DELIVERYDATE.$prefixOp("DAYS_BETWEEN", new Date())
         * })
         */
        $prefixOp: fct("_prefixOp", notation["_prefixOp"]),
        $preOp: fct("_preOp", notation["_preOp"]),
        $geoPreOp: fct("_geoPreOp", notation["_geoPreOp"]),
        $postOp: fct("_postOp", notation["_postOp"]),
        $parId: fct("_parId", notation["_parId"]),

        $notation: notation
    }
}();


/*********************************************************************************
 * Binding query reference functions to any object
 *********************************************************************************/

Query.addExpressionFunctions = function(entity, obj, prefix) {
    function defineFct(onObj, f, prefix) {
        var f0 = f;
        if (typeof onObj[f] !== 'undefined') {
            return; // no shortcut because of built-in properties 'name', 'length', 'caller', 'prototype'
        }
        Object.defineProperty(onObj, f0, {
            get: function() {
                return Query.F.$col(entity.$_mapping ? entity : {$_mapping: entity}, f, prefix);
            },
            set: function(value) {},
            configurable: true
        });
    }
    var mapping = entity.$_mapping || entity;
    for (var f in mapping) {
        defineFct(obj, f, prefix ? prefix : entity);
    }
};


/*********************************************************************************
 * Admin stuff
 *********************************************************************************/

Query.getQueryCount = function () {
    return queryCount;
};

exports.F = Query.F;
exports.Query = Query;
exports.Ref = Ref;
exports.Par = Par;
exports.createQuery = createQuery;
exports.addExpressionFunctions = Query.addExpressionFunctions;
