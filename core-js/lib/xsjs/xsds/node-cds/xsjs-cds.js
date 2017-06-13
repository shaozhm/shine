var cds = require("./cds");
var origExecFct = cds.queries.Query.prototype.$execute;

exports.init = function(tx) {

    function resolveEntityReferences(obj) {
        if (typeof obj === 'object' || typeof obj === 'function') {
            if (obj.$_metadata) {
                return obj.$_metadata.entityName;
            }
            var result = {};
            for (var p in obj) {
                result[p] = resolveEntityReferences(obj[p]);
            }
            return result;
        } else {
            return obj;
        }
    }

    function adaptImport(importSpec) {
        var result = {
            $entity: importSpec[0] + "::" + importSpec[1],
            $fields: resolveEntityReferences(importSpec[2]),
            $options: importSpec[3]
        };
        if (importSpec[3] && importSpec[3].$entityName) {
            result.$name = importSpec[3].$entityName;
        }
        if (importSpec[3] && importSpec[3].$viaTable) {
            result.$viaEntity = importSpec[3].$viaTable;
        }
        return [result];
    }

    function adaptDefine(importSpec) {
        var matches = /"(\w+)"\."([\w.:]+)"/g.exec(importSpec[1]);
        var result = {
            $name: importSpec[0],
            $table: matches[2],
            $schema: matches[1],
            $fields: resolveEntityReferences(importSpec[2]),
            $options: importSpec[3]
        };
        return [result];
    }

    var wrapperRepo = {};

    function makeSkeleton(values, mapping) {
        var res;
        for (var p in mapping) {
            if (p.substring(0, 1) === '$') continue;
            if (!res) res = {};
            if (values[p] && (values[p].$__entity || values[p].$_entity)) {
                res[p] = values[p];
            } else if (Object.prototype.toString.call(values[p]) === "[object Array]") {
                var nextMapping = mapping[p].$association ? mapping[p].$association.$class.$_mapping : mapping[p];
                res[p] = values[p].map(function (e) {
                    if (e.$__entity || e.$_entity) {
                        return e;
                    } else {
                        return makeSkeleton(e, nextMapping);
                    }
                });
            } else if (Object.prototype.toString.call(values[p]) === "[object Object]") {
                var nextMapping = mapping[p].$association ? mapping[p].$association.$class.$_mapping : mapping[p];
                res[p] = makeSkeleton(values[p], nextMapping);
            } else if (typeof values[p] !== 'undefined') {
                res[p] = values[p];
            } else if (mapping[p].$association && (mapping[p].$viaBacklink || mapping[p].$viaEntity)) {
                res[p] = [];
            } else if (mapping[p].$association) {
                res[p] = null;
            } else {
                res[p] = makeSkeleton({}, mapping[p]);
            }
        }
        return res;
    }

    function getWrapper(name, entity) {
        if (!wrapperRepo[name]) {
            var result = function (skeleton) { // constructor
                var e = entity;
                if (!skeleton.$__entity) {
                    skeleton = makeSkeleton(skeleton, e.$_mapping);
                }
                Object.defineProperty(skeleton, '$save',
                    {
                        value: function () {
                            return tx.$save.sync(entity.$prepare(this));
                        },
                        enumerable: false,
                        configurable: true
                    });
                Object.defineProperty(skeleton, '$persist',
                    {
                        value: function () {
                            return tx.$save.sync(entity.$prepare(this));
                        },
                        enumerable: false,
                        configurable: true
                    });
                Object.defineProperty(skeleton, '$discard',
                    {
                        value: function () {
                            return tx.$discard.sync(entity.$prepare(this));
                        },
                        enumerable: false,
                        configurable: true
                    });
                return skeleton;
            };

            for (var p in entity) {
                result[p] = entity[p];
            }
            cds.queries.addExpressionFunctions(entity, result);

            result.$findAll = function (cond) {
                if (arguments.length === 0) {
                    cond = {};
                }
                var r = entity.$findAll.sync.call(entity, cond);
                return r;
            };

            result.$saveAll = function (instances) {
                tx.$save(instances.map(function (inst) {
                    return entity.$prepare(inst);
                }));
            };

            result.$discardAll = function (instances) {
                tx.$discard(instances.map(function (inst) {
                    return entity.$prepare(inst);
                }));
            };

            result.$persistAll = result.$saveAll;

            result.$find = function (cond) {
                if (arguments.length === 0) {
                    cond = {};
                }
                var r = entity.$findAll.sync.call(entity, cond)[0];
                return r;
            };

            result.$get = function (cond) {
                if (arguments.length === 0) {
                    cond = {};
                }
                var r = entity.$get.sync.call(entity, cond);
                return r;
            };

            result.$query = function () {
                var q = entity.$query();
                q.syncExecute = true;
                return q;
            }

            wrapperRepo[name] = result;
        }
        return wrapperRepo[name];
    }

    var retrieveEntity = function (nodeImport) {
        var alias = nodeImport[0].$name;
        var entityName = nodeImport[0].$entity;
        var imp = cds.$importEntities.sync(nodeImport);
        var entity = imp[alias || entityName];
        var name = entity.$_metadata.entityName;
        var wrapped = getWrapper(name, entity);
        return wrapped;
    }

    exports.importEntity = function () {
        var args = Array.prototype.slice.call(arguments);
        return retrieveEntity.call(this, adaptImport(args));
    };

    exports.$importEntity = exports.importEntity;

    exports.defineEntity = function () {
        var args = Array.prototype.slice.call(arguments);
        return retrieveEntity.call(this, adaptDefine(args));
    };

    exports.getEntity = function (name) {
        return getWrapper(name, cds.$getEntitySync(name));
    };

    cds.queries.Query.prototype.$execute = function () {
        if (!this.syncExecute) {
            return origExecFct.apply(this, arguments);
        } else {
            var args = Array.prototype.slice.call(arguments);
            if (args.length === 0) {
                args = [{}];
            }
            return origExecFct.sync.apply(this, args);
        }
    }

    exports.cdsAsync = cds;
    exports.Manager = {
        clearCache: function () {
            cds._clearCaches();
        },
        resetCaches: function () {
            cds._clearCaches();
        }
    };

    exports.Transaction = {
        $commit: function (callback) {
            tx.$commit(function(err) {
                callback(err);
            });
        },

        $close: function () {
            tx.$close();
        }
    }

    exports.Rename = {
        $lowercase: "lowercase"
    };

    exports.SqlQuery = cds.queries;
    exports.Query = cds.createQuery;

    cds.extensionPoints.instanceMethods = function (instance) {
        instance.$save = function() {
            tx.$save(instance);
        }
        instance.$persist = instance.$save;
        instance.$discard = function() {
            tx.$discard(instance);
        }
        return instance;
    };
    return exports;
}