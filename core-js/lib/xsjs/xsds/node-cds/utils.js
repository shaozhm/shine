/// winston logger for node-cds ///////////////////////////////////

var winston = require("winston");
var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)()
    ]
});
logger.level = process.env.CDS_LOGLEVEL || 'warn';
exports.logger = logger;


/// Property access and manipulation //////////////////////////////

// iterate over instance based on structure information
exports.forInstance = forInstance;
function forInstance(value, struct, fns, prefix) {
    // fns: function(prefix, field, value, struct), ...
    prefix = prefix || "";
    for (var f in struct) {
        if (typeof struct[f] === "object") {
            for (var a in fns)
                if (a in struct[f])
                    fns[a](prefix, f, value, struct);
            if (value !== null && value[f] !== undefined && f[0] !== "$")
                forInstance(value[f], struct[f], fns, prefix + f + ".");
        } else if ("$default" in fns) {
            fns.$default(prefix, f, value, struct);
        }
    }
}

exports.forStruct = forStruct;
function forStruct(struct, fns, prefix) {
    // fns: function(struct, field, prefix), ...
    prefix = prefix || "";
    for (var f in struct) {
        if (typeof struct[f] === "object") {
            for (var a in fns)
                if (a in struct[f])
                    fns[a](struct, f, prefix);
	    if (f[0] !== "$")
		forStruct(struct[f], fns, prefix + f + ".");
        } else if ("$default" in fns) {
            fns.$default(struct, f, prefix);
        }
    }
}

// add dotted path name to nested object with empty value
// e.g., { a: { x: 1 } } + a.b.c --> { a: { b: { c: {} }, x: 1 } }
exports.mkPropPath = mkPropPath;
function mkPropPath(obj, dottedPath) {
    if (dottedPath === "")
	return obj;
    var props = dottedPath.split(".");
    var o = obj;
    for (var i = 0; i < props.length; ++i) {
        var p = props[i];
        if (!(p in o) || typeof o[p] !== "object")
            o[p] = {};
        o = o[p];
    }
    return o;
}

// set value: set({}, "a.b.c", 69) --> { a: { b: { c: 69 } } }
// also supports array via numerical property names
exports.setPropPath = setPropPath;
function setPropPath(obj, dottedPath, value) {
    if (dottedPath === "")
        return obj;
    var props = dottedPath.split(".");
    var o = obj;
    for (var i = 0; i < props.length - 1; ++i) {
        var p = props[i];
        if (!(p in o) || typeof o[p] !== "object")
            o[p] = {};
        if (o[p] === null)
            return o;  // cannot set inside null instance
            //throw new Error("*** ASSERT FAIL *** setting property of null value: " + p);
        o = o[p];
    }
    o[props.pop()] = value;
    return o;
}

// optimized version for new objects
exports.mkNewPath = function(dottedPath) {
    var props = dottedPath.split(".");
    var o = {};
    while (props.length > 0) {
        var p = props.pop();
        var t = {};
        t[p] = o;
        o = t;
    }
    return o;
};

// extract property using dotted path
exports.getPropPath = function(obj, dottedPath) {
    var props = dottedPath.split(".");
    while (props.length > 0) {
        if (typeof obj === "undefined" || obj === null)
            return undefined;  // missing property
        var p = props.shift();
        obj = obj[p];
    }
    return obj;
};

// (sync) ditto but handle arrays in between
// returns: { path1: value1, path2: value2, ... }
exports.getPropPathSet = function(obj, dottedPath) {
    var props = dottedPath.split("."), values = { "": obj };
    while (props.length > 0) {
        var p = props.shift(), nexts = {};
        for (var i in values) {
            var v = values[i];
            if (v && p in v) {
                if (exports.isArray(v[p]))
                    for (var x in v[p])
                        nexts[(i ? i + "." + p : p) + "." + x] = v[p][x];
                else
                    nexts[i ? i + "." + p : p] = v[p];
            }
        }
        values = nexts;
    }
    return values;
};

// check if to-many association
exports.isToMany = function (a) {
    return a.$viaBacklink || a.$viaEntity || a.$on;
}


/// misc. utility functions

// check for Array
// NOTE: using the simpler "instanceof Array" seems to mess with Fibrous?!
exports.isArray = function (o) {
    return Object.prototype.toString.call(o) === "[object Array]";
}

// create shallow copy of object or array
exports.shallowCopy = function(o) {
    if (typeof o === "object" && o !== null) {
        var r;
        if (exports.isArray(o)) {
            r = [];
            for (var i = 0; i < o.length; ++i)
                r.push(o[i]);
        } else {
            r = {};
            for (var p in o)
                if (o.hasOwnProperty(p))
                    r[p] = o[p];
        }
        return r;
    } else {
        return o;
    }
};

// create deep copy of object (unshares arrays, dates)
exports.deepCopy = function(obj) {
    var seen = [];
    var copy = function(o) {
        if (o === null || typeof o !== "object")
            return o;
        if (o instanceof Date) {
            return new Date(o.getTime());
        }
        if (o instanceof ctypes.Int64) {
            return ctypes.Int64.join(ctypes.Int64.hi(o), ctypes.Int64.lo(o));
        }
        if (seen.indexOf(o) >= 0) {
            throw new TypeError("deep copy of recursive data structure");
        }
        var clone;
        if (exports.isArray(o)) {
            clone = [];
            for (var i = 0; i < o.length; ++i)
                clone.push(copy(o[i]));
        } else {
            var j = seen.length;
            seen.push(o);
            clone = {};
            for (var p in o)
                if (o.hasOwnProperty(p))
                    clone[p] = copy(o[p]);
            seen.splice(j);
        }
        return clone;
    };
    return copy(obj);
};

// add non-enumerable property to object
exports.addInternalProp = function (obj, prop, val) {
    Object.defineProperty(obj, prop, {value: val, configurable: true});
}


/// DB Stuff /////////////////////////////////////////////////////////

// properly quote table or schema + table name
exports.quoteTable = function (name) {
    var parts = name.match(/^(?:("[^"]+"|[^".]+)\.)?(.*)$/);
    var quotedName =
        (parts[0] ? (parts[0][0] === '"' ? parts[0] : '"' + parts[0] + '"') : "") +
        (parts[1][0] === '"' ? parts[1] : '"' + parts[1] + '"');
    return quotedName;
}


/// Debugging ////////////////////////////////////////////////////////

// pretty-print non-internal properties
exports.ppp = function(obj, verbose) {
    var seen = [];
    function repl(k, v) {
	if (typeof v === 'object') {
            if (!verbose && k.substring(0, 2) === "$_")
                return "#$";
            if (v !== null && seen.indexOf(v) >= 0)
                return "#obj"; //v instanceof Struct ? "#" + v : "#obj";
            seen.push(v);
        } else if (typeof v === 'function') {
            return "#fn";
        }
        return v;
    }
    return JSON.stringify(obj, repl, 4);
};