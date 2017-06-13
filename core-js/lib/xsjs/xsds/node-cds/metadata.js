var async = require('async');

var transaction = require('./transaction');
var manager = require('./manager');
var utils = require('./utils');
var Queue = require('./util/Queue');
var queries = require("./cds-queries");
var SqlQuery = queries.Query;

var logger = utils.logger;


/// entity management ///////////////////////////////////////////////////////

// known resolved entities
var knownEntities = {};

// pending callbacks for async getEntity()
var importNotifications = {};

// metadata cache
var sqlMetadata = {};
var cdsMetadata = {};


/* import list of entities
 *
 * $entity:    full CDS entity name  -- OR --
 * $table:     SQL table name (implies $noCds)
 * $name:      alias name
 * $schema:    schema to use for table lookup
 * $fields:    field mapping extensions and overrides
 * $unmanaged: instances are not managed, thus cannot use $get, $findAll
 * $options:   internal options, do not use: $auto, $noCds, $unmanaged
 *
 * Note that alias names are resolved only within each batch import reuqest.
 */

// central import request queue for serializing imports
var importQueue = new Queue.Queue();

exports._import = function (refs, opts, callback) {
    // work in progress: entities and dependencies to import
    var pool = {};

    // request import of dependent associated entities
    function addDepImports(entity) {
        utils.forStruct(entity.$_mapping, {
            $association: function(s, f, p) {
                var name = s[f].$association.$entity;
                var schema = opts.$schema || s[f].$association.$schema;
                todo.push({ $entity: name, $schema: schema,
                    $options: { $auto: true } });
                logger.debug("node-cds import: added dependency " +
                    entity.$_metadata.entityName + " -> " + name);
                if (s[f].$association.$viaEntity) {
                    name = s[f].$association.$viaEntity;
                    todo.push({$entity: name, $schema: schema,
                        $options: {$unmanaged: true, $auto: true}});
                    logger.debug("node-cds import: added dependency " +
                        entity.$_metadata.entityName + " -> " + name);
                }
            }
        });
    }

    // main metadata query function
    function query(entityName, ref, callback) {
        var cdsFullname = ref.$entity;
        var tableName = ref.$table || cdsFullname;
        var schemaName = ref.$schema || "";  // '"' + ref.$schema + '".' : "";
        var fields = ref.$fields || {};
        var options = ref.$options || {};

        if (!entityName)
            return callback("Missing entity name");
        if (!tableName)
            return callback("Unknown entity table");

        if (ref.$table && !ref.$entity)
            options.$noCds = true;
        if (ref.$unmanaged)
            options.$unmanaged = true;

        // retrieve metadata and build entity
        logger.debug("node-cds import: query metadata for " + schemaName + "." + tableName);
        getSqlMetadata(tableName, schemaName, function(err, sqlMetadata) {
            if (err)
                return callback("Error importing " + cdsFullname + ": " + err);
            getCdsMetadata(cdsFullname, schemaName, options, function(err, cdsMetadata) {
                if (err)
                    return callback("Error importing " + cdsFullname + ": " + err);
                if (entityName in pool)
                    throw new Error("*** ASSERT FAIL *** conflicting entity in pool");
                var entity = makeEntity(entityName, tableName, schemaName, fields,
                    sqlMetadata, cdsMetadata, options);
                if (typeof entity === "string")
                    return callback(entity);  // actually, we got an error
                pool[entityName] = entity;
                logger.debug("node-cds import: added " + entityName + " to wip pool");
                addDepImports(entity);  // recursively import target entities
                return callback(null);
            });
        });
    }

    // top level: request queue handling
    var todo = [];
    for (var i in refs) {
        var r = utils.shallowCopy(refs[i]);
        for (var p in opts)  // merge in global options
            if (!(p in r))
                r[p] = opts[p];
        todo.push(r);
    }

    function start(callback) {
        async.whilst(pending, loop, callback);
    }

    function pending() {
        return todo.length > 0;
    }

    function loop(callback) {
        var item = todo.shift();
        if (!item)
            throw new Error("*** ASSERT FAIL *** empty todo list");
        var entityName = item.$name || item.$entity || item.$table;
        logger.debug("node-cds import loop: processing " + entityName);

        // choke recursive imports
        var previously = pool[entityName] || knownEntities[entityName];
        if (previously) {
            logger.debug("node-cds import: " + entityName + " already known");
            if (!(entityName in pool))
                pool[entityName] = previously;  // present to callback
            var options = item.$options || {};
            if (!options.$auto) {
                updateEntity(previously, item.$fields || {}, options);
                addDepImports(previously);
            }
            return callback(null);
        }

        query(entityName, item, callback);
    }

    function done(err) {
        if (err)
            return callback(err, []);

        // add XS interface and wire up associations in wip skeletons, add to cache
        for (var i in pool) {
            if (!pool[i].$_metadata.isResolved) {
                resolveEntity(pool[i], pool);
                registerEntity(pool[i]);
            }
            logger.debug("node-cds import: " + pool[i].$_metadata.entityName + " imported");
        }

        // return result via wip pool
        return callback(null, pool);
    }

    importQueue.push(start, done);
};


// trigger import of all associated entities
function makeEntity(entityName, tableName, schemaName, fields, sqlMetadata, cdsMetadata, options) {
    // prepare field mapping
    var sqlMapping = buildSqlMapping(sqlMetadata);
    var cdsMapping = buildCdsMapping(cdsMetadata);
    var mapping = mergeMapping(sqlMapping, cdsMapping);
    mapping = mergeMapping(mapping, fields);
    var check = checkMapping(mapping);
    if (check)
        return check;  // found error

    // assemble entity metadata
    var metadata = {
        entityName: entityName,
        tableName: tableName,
        schemaName: schemaName,
        sqlMetadata: sqlMetadata,
        cdsMetadata: cdsMetadata,
        isUnmanaged: options.$unmanaged || false,
        isAutoImport: options.$auto || false,
        isResolved: false  // true iff mapping contains associated entiy objects
    };
    updateMetadata(metadata, mapping);

    // build and register unresolved entity object
    entity = {
        $_metadata: metadata,
        $_mapping: mapping
    };

    // verify entity (in particular, mapping)
    var e = verifyEntity(entity);
    if (e) return e;

    // add query interface
    SqlQuery.addExpressionFunctions(entity, entity);
    entity.$query = function (client) {
        var param = {};
        param["t0"] = {entity: this};
        return new SqlQuery(client, param);
    };

    entity.$ref = function (id) {
        return new queries.Ref(this, id);
    };

    entity.$from = function (id) {
        var param = {};
        var e = this;
        param[id] = {entity: e};
        return new SqlQuery(null, param);
    };

    return entity;
}

// check various entity properties
function verifyEntity(entity) {
    var error = null;
    utils.forStruct(entity.$_mapping, {
        $association: function (s, f, p) {
            var assoc = s[f].$association;
            if (assoc.$viaEntity) {
                if (!assoc.$source)
                    error = "Error: missing $source in viaEntity association";
                if (!assoc.$target)
                    error = "Error: missing $target in viaEntity association";
            }
        }
    });
    return error;
}

// update auto-imported entity with new field data
function updateEntity(entity, fields, options) {
    var entityName = entity.$_metadata.entityName;
    logger.debug("node-cds import: updating entity " + entityName);
    delete knownEntities[entityName];  // remove temporarily, still in wip pool
    entity.$_mapping = mergeMapping(entity.$_mapping, fields);
    entity.$_metadata.isResolved = false;
    updateMetadata(entity.$_metadata, entity.$_mapping);
    if (!options.$auto)
        entity.$_metadata.isAutoImport = false;
}

// update metadata information based on new mapping (in-place update)
function updateMetadata(metadata, mapping) {
    var keys = {}, hasKeys = false;
    utils.forStruct(mapping, {
        $key: function(s, f, p) {
            if (s[f].$key) {
            var column = s[f].$column;
            keys[p + f] = {
                $seq: s[f].$key, //metadata.sqlMetadata[column].$key,
                $type: metadata.sqlMetadata[column].$type
            };
            hasKeys = true;
            }
        }
    });
    if (!hasKeys && !metadata.isUnmanaged)  // need key for managing instances
        throw new Error("no key defined: " + metadata.entityName);

    var revMapping = {};
    utils.forStruct(mapping, {
        $column: function(s, f, p) {
            revMapping[s[f].$column] = p + f;
        }
    });

    metadata.keyFields = keys;
    metadata.revMapping = revMapping;
    //metadata.secondaryIndexes = [];
}

// resolve entity name references by entity classes
function resolveEntity(entity, pool) {
    logger.debug("node-cds import: resolving " + entity.$_metadata.entityName);
    if (entity.$_metadata.isResolved)
        throw new Error("*** ASSERT FAIL *** resolving resolved entity: " +
            entity.$_metadata.entityName);

    function getByName(name) {
        var e = pool[name] || knownEntities[name];
        if (!e)
            throw new Error("*** ASSERT FAIL *** missing entity: " + name);
        return e;
    }

    utils.forStruct(entity.$_mapping, {
        $association: function(s, f, p) {
	        var name = s[f].$association.$entity;
	        s[f].$association.$class = getByName(name);
	        name = s[f].$association.$viaEntity;
	        if (name)
		        s[f].$association.$viaClass = getByName(name);
	    }
    });
    entity.$_metadata.isResolved = true;
};


/// other management function ///////////////////////////////////////

// return previously imported entity, or save callback if not imported yet
exports.getEntity = function(name, callback) {
    logger.debug("node-cds import: getting entity " + name);
    if (name in knownEntities)
        return callback(null, knownEntities[name]);
    logger.debug("node-cds import: getEntity waiting for entity " + name);
    if (!(name in importNotifications))
        importNotifications[name] = [];
    importNotifications[name].push(callback);
};

// sync version (used by metadata import)
exports.getEntitySync = function (name) {
    return knownEntities[name] || null;
};

exports.getKnownEntities = function() {
    return knownEntities;
};


// add to known entities (imported and resolved)
// NOTE: The function returns the actual entity object that has been registered.
// For parallel imports (e.g., triggered by auto-imports), the returned entity
// object must supercede the original object passed to registerEntity.
function registerEntity(entity) {
    var name = entity.$_metadata.entityName;
    if (name in knownEntities)
        throw new Error("*** ASSERT FAIL *** trying to register known entity " + name);
    logger.debug("node-cds import: registering entity " + name);

    knownEntities[name] = entity;

    // check for pending requests
    if (name in importNotifications) {
        var notify = importNotifications[name];
        for (var i in notify)
            (notify[i])(null, entity);
        delete importNotifications[name];
    }
};


/// support functions ////////////////////////////////////////////////////////////

// compute dependency graph for entity that shows
// (1) all (non-cyclic) associations,
// (2) all cyclic associations, and
// (3) the projection for $query() that covers all non-recursive associations
exports.computeRelations = function (entity) {
    var entityName = entity.$_metadata.entityName;
    var projection = {}, assocs = [], cycles = [];

    var _build = function (entity, prefix, seen) {
        utils.setPropPath(projection, prefix + "$all", true);
        utils.forStruct(entity.$_mapping, {
            $association: function (m, f, p) {
                var target = m[f].$association.$entity;
                var targetEntity = m[f].$association.$class;
                if (typeof targetEntity === "undefined")
                    throw new Error("*** ASSERT FAIL *** missing target entity");
                var isToMany = utils.isToMany(m[f].$association);
                var isLazy = m[f].$association.$lazy;
                if (seen.indexOf(target) >= 0) {
                    cycles.push({field: prefix + p + f, assoc: m[f].$association});
                    if (isToMany) {
                        // force projection, but without recursion
                        utils.setPropPath(projection, prefix + p + f, {$all: true});
                    }
                } else {
                    assocs.push({
                        field: prefix + p + f, target: targetEntity, toMany: isToMany, lazy: isLazy
                    });
                    if (!isLazy)
                        _build(targetEntity, prefix + p + f + ".", seen.concat([target]));
                }
            }
        });
    }
    _build(entity, "", [entityName]);

    logger.debug("node-cds import: analyzed " + entityName + ": proj = " +
        JSON.stringify(projection) + ", " + assocs.length + " assocs" + cycles.length + " cycles");

    return {
        projection: projection,
        associations: assocs,
        cycles: cycles
    };
}


// (async) retrieve SQL metadata for database table
function getSqlMetadata(tableName, schemaName, callback) {
    var sqlname = schemaName ? schemaName + "." + tableName : tableName;
    if (sqlname in sqlMetadata) {
        return callback(null, sqlMetadata[sqlname]);
    }
        
    // get type information
    var metadata = {};
    var processResult = function(err, rows) {
        if (err)
            return callback(err);
        if (rows.length == 0)
            return callback("database table " + tableName + " not found");
        for (var i = 0; i < rows.length; i++) {
            var columnName = rows[i].COLUMN_NAME;
            metadata[columnName] = {
                $type: rows[i].DATA_TYPE_ID,
                $csType: rows[i].CS_DATA_TYPE_ID,
                $size: rows[i].SCALE,
                $key:  rows[i].IS_PRIMARY_KEY === "TRUE"
            };
  	    }
        sqlMetadata[sqlname] = metadata;
        return callback(null, metadata);
    };

    transaction.getClient(null, function(err, client) {
        if (err)
            return callback(err);
        var schema = schemaName ? "'" + schemaName + "'" : "CURRENT_SCHEMA";
        client.exec(
            "SELECT tc.COLUMN_NAME, tc.DATA_TYPE_ID, tc.CS_DATA_TYPE_ID, tc.SCALE, cs.IS_PRIMARY_KEY " +
            "FROM SYS.TABLE_COLUMNS tc LEFT OUTER JOIN SYS.CONSTRAINTS cs " +
            "ON tc.SCHEMA_NAME = cs.SCHEMA_NAME AND tc.TABLE_NAME = cs.TABLE_NAME " +
            "AND tc.COLUMN_NAME = cs.COLUMN_NAME " +
            "WHERE tc.SCHEMA_NAME = " + schema + " AND tc.TABLE_NAME = '" + tableName + "'",
            function(err, result) {
                transaction.releaseClient(client);
                processResult(err, result);
            });
    });
};

// (async) retrieve CDS metadata from unofficial CDS metadata tables
function getCdsMetadata(fullname, schema, options, callback) {
    if (options.$noCds)
        return callback(null, null);
    if (fullname in cdsMetadata)
        return callback(null, cdsMetadata[fullname]);

    // prepare queries for retrieving assocs and structs
    var sqlA =
        'SELECT e.ARTIFACT_NAME AS "n",' +
        ' a.SCHEMA_NAME, e.SCHEMA_NAME,' +
        ' a.TARGET_ARTIFACT_SCHEMA_NAME AS "ts",' +
        ' a.TARGET_ARTIFACT_NAME AS "tn",' +
        ' a.JOIN_CONDITION AS "on",' +   // unmanaged assoc
        ' e.ELEMENT_NAME AS "cn",' +     // component name
        ' e.AUX_ELEMENT_INFO AS "fk"' +  // alias name
        ' FROM SYS.CDS_ARTIFACT_DEFINITION(?, ?) AS e JOIN SYS.CDS_ASSOCIATIONS AS a' +
        ' ON e.ARTIFACT_NAME = a.ASSOCIATION_NAME AND a.SCHEMA_NAME = e.SCHEMA_NAME' +
        ' WHERE e.ARTIFACT_KIND = \'ASSOCIATION_ELEMENT\' OR' +
        ' (e.ARTIFACT_KIND = \'ASSOCIATION\' AND a.ASSOCIATION_KIND = \'UNMANAGED\')';
    var sqlACS =
        'SELECT e.ARTIFACT_NAME AS "n",' +
        ' a.SCHEMA_NAME, e.SCHEMA_NAME,' +
        ' a.TARGET_ARTIFACT_SCHEMA_NAME AS "ts",' +
        ' a.TARGET_ARTIFACT_NAME AS "tn",' +
        ' a.JOIN_CONDITION AS "on",' +   // unmanaged assoc
        ' e.ELEMENT_NAME AS "cn",' +     // component name
        ' e.AUX_ELEMENT_INFO AS "fk"' +  // alias name
        ' FROM SYS.CDS_ARTIFACT_DEFINITION(CURRENT_SCHEMA, ?) AS e JOIN SYS.CDS_ASSOCIATIONS AS a' +
        ' ON e.ARTIFACT_NAME = a.ASSOCIATION_NAME AND a.SCHEMA_NAME = e.SCHEMA_NAME' +
        ' WHERE e.ARTIFACT_KIND = \'ASSOCIATION_ELEMENT\' OR' +
        ' (e.ARTIFACT_KIND = \'ASSOCIATION\' AND a.ASSOCIATION_KIND = \'UNMANAGED\')';
    var sqlS =
        'SELECT ELEMENT_NAME AS "n",' +
        ' USED_ARTIFACT_SCHEMA AS "ts",' +
        ' USED_ARTIFACT_NAME AS "tn"' +
        ' FROM SYS.CDS_ARTIFACT_DEFINITION(?, ?)' +
        ' WHERE USED_ARTIFACT_KIND = \'STRUCTURED_TYPE\'';
    var sqlSCS =
        'SELECT ELEMENT_NAME AS "n",' +
        ' USED_ARTIFACT_SCHEMA AS "ts",' +
        ' USED_ARTIFACT_NAME AS "tn"' +
        ' FROM SYS.CDS_ARTIFACT_DEFINITION(CURRENT_SCHEMA, ?)' +
        ' WHERE USED_ARTIFACT_KIND = \'STRUCTURED_TYPE\'';

    transaction.getClient(null, function(err, client) {
        if (err)
            return callback(err);
        async.series([
            function(cb) { client.prepare(sqlA, cb); },
            function(cb) { client.prepare(sqlACS, cb); },
            function(cb) { client.prepare(sqlS, cb); },
            function(cb) { client.prepare(sqlSCS, cb); }
        ], function(err, stmts) {
            if (err)
                throw new Error("*** ASSERT FAIL *** invalid CDS metadata query");
            getStructsAndAssocs(stmts, schema, fullname, function (err, data) {
                transaction.releaseClient(client);
                cdsMetadata[fullname] = data;
                return callback(err, data);
            });
        });
    });
}

// async
// recursively retrieve assoc and struct information
function getStructsAndAssocs(stmts, schema, fullname, callback) {
    logger.debug("node-cds import: retrieve CDS assoc for " + fullname);

    // retrieve association metadata from CDS tables
    var getAssocs = function(callback) {
        var s = schema ? stmts[0] : stmts[1];
        var a = schema ? [schema, fullname] : [fullname];
        s.exec(a, function(err, rows) {
            var assocs = {};
            if (err)
                return callback("Error retrieving CDS association metadata: " + err, assocs);
            for (var i = 0; i < rows.length; ++i) {
                var fieldName = rows[i].n.slice(fullname.length + 1);
                if (!(fieldName in assocs)) {
                    assocs[fieldName] = {
                        $association: rows[i].tn,
                        $schema: rows[i].ts
                    };
                }
                if (rows[i].on && rows[i].on.length) {
                    var cond = String.fromCharCode.apply(null, rows[i].on);
                    assocs[fieldName].$on = cond;
                } else {
                    var foreignKey = rows[i].cn;
                    var foreignKeyAlias = rows[i].fk;
                    if (foreignKey !== foreignKeyAlias && foreignKeyAlias !== null) {
                        if (!("$aliases" in assocs[fieldName]))
                            assocs[fieldName].$aliases = {};
                        assocs[fieldName].$aliases[foreignKey] = foreignKeyAlias;
                    }
                }
            }
            return callback(null, assocs);
        });
    };

    // retrieve structure metadata from CDS tables
    var getStructs = function(callback) {
        var s = schema ? stmts[2] : stmts[3];
        var a = schema ? [schema, fullname] : [fullname];
        s.exec(a, function(err, rows) {
            var structs = {};
            if (err)
                return callback("Error retrieving CDS type metadata: " + err, structs);
            for (var i = 0; i < rows.length; ++i) {
                var componentName = rows[i].n;
                structs[componentName] = {
                    schema: rows[i].ts,
                    name: rows[i].tn
                };
            }
            return callback(null, structs);
        });
    };

    // recursively get assocs and structs
    getAssocs(function (err, assocs) {
        if (err)
            return callback(err, null);
        getStructs(function (err, structs) {
            if (err)
                return callback(err, null);
            var fns = [];
            for (var s in structs) {
                var fn = (function (result, field) {
                    return function (cb) {
                        getStructsAndAssocs(stmts, structs[field].schema, structs[field].name,
                            function (err, data) {
                                if (err)
                                    return cb(err, null);
                                result[field] = data;
                                cb(null);  // result is ignored
                            });
                    };
                })(assocs, s);
                fns.push(fn);
            }
            async.parallel(fns, function (err, ignored) {
                callback(err, assocs);
            });
        });
    });
}

function buildSqlMapping(sqlMetadata, ignoredColumns) {
    ignoredColumns = ignoredColumns || [];
    // add all SQL columns as fields
    var mapping = {};
    for (var columnName in sqlMetadata) {
        if (ignoredColumns.indexOf(columnName) >= 0)
            continue;
        var field = utils.mkPropPath(mapping, columnName);
        field.$column = columnName;
        if ("$key" in sqlMetadata[columnName])
            field.$key = sqlMetadata[columnName].$key;
    }
    return mapping;
}

function buildCdsMapping(cdsMetadata) {
    // convert CDS association metadata into mapping format
    var assocs = {};
    utils.forStruct(cdsMetadata, {
        $association: function(s, f, p) {
            var a = utils.mkPropPath(assocs, p + f);
            a.$association = {
                $entity: s[f].$association,
                $schema: s[f].$schema,
                $lazy: false
            };
            if (s[f].$on)
                a.$association.$on = s[f].$on;
            if (s[f].$aliases)
                a.$aliases = s[f].$aliases;
        }
    });
    return assocs;
}

function mergeMapping(mapping, newFields) {
    // recursively copy nested properties from src to dst
    var copy = function(dst, src) {
        // special handling for $association/$column overrides
        if ("$column" in src && "$association" in dst ||
            "$association" in src && "$column" in dst) {
            for (var p in dst)
                delete dst[p];
            copy(dst, src); // redo
            return;
        }
        // copy properties
        for (var f in src) {
            if (typeof src[f] === "object") {
                // merge props of src structure
                if (!(f in dst))
                    dst[f] = {};
                copy(dst[f], src[f]);
            } else if (src[f] === false) {
                // remove prop in dst
                delete dst[f];
            } else {
                // copy prop from src to dst
                dst[f] = src[f];
            }
        }
    };

    //var result = Entities.cloneJSON(mapping);
    copy(mapping, newFields);

    // aliases: rename fields by moving
    utils.forStruct(mapping, {
        $aliases: function (s, f, p) {
            var aliases = s[f].$aliases;
            for (var oldf in aliases) {
                var newf = aliases[oldf];
                utils.setPropPath(s[f], newf, s[f][oldf]);
                delete s[f][oldf];
            }
            delete s[f].$aliases;
        }
    });

    return mapping;
}

// various validity and consistency checks for mapping
function checkMapping(mapping) {
    var error = null;
    utils.forStruct(mapping, {
        $association: function (s, f, p) {
            var assoc = s[f].$association;
            if ("$on" in assoc && "$cascadeDiscard" in assoc)
                error = "Cascade discard invalid for unmanaged associations";
        }
    });
    return error;
}


// testing and debugging

exports._clearImports = function() {
    logger.info("node-cds: reset imports");
    knownEntities = {};
};