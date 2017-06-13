var utils = require('./utils');


// NOTE: function raises exception in case of invalid expression
exports.buildInstanceFilter = function(entity, condition) {
    return function(instance) {
        return evalExpression(entity, condition, instance);
    };
};


// check if given instance matches property criteria
function evalExpression(entity, criteria, instance) {
    var realcrit = criteria.$eq || criteria.$ne || criteria;
    var match = true;
    utils.forInstance(realcrit, entity.$_mapping, {
        $column: function(p, f, v, m) {
            if (v === null || typeof v[f] === "undefined")
                return;  // property not part of criteria
            var value = utils.getPropPath(instance, p + f);
            if (!evalCondition(v[f], value))
                match = false;
        },
        $association: function(p, f, v, m) {
            if (v === null || typeof v[f] === "undefined")
                return;  // property not part of criteria
            var value = utils.getPropPath(instance, p + f);
            // empty association
            if (v[f] === null) { // short for { $none: true }
                match = match && !value;
                return;
            } else if ("$none" in v[f]) {
                match = match && (v[f].$none && isnone(value) || !v[f].$none && !isnone(value));
                return;
            } else if ("$empty" in v[f]) {  // deprecated for "$none"
                match = match && (v[f].$empty && isnone(value) || !v[f].$empty && !isnone(value));
                return;
            } else if ("$null" in v[f]) {
                throw new Error("invalid $null operator on association");
            } else if (!value) {
                match = match && (v[f].$none || v[f].$empty);
                return;
            }
            // non-empty association
            if (utils.isArray(value))
                throw new Error("invalid navigation in expression");
            if (!("$_entity" in value))
                throw new Error("*** ASSERT FAIL *** comparing against non-instance");
            if ("$_entity" in v[f]) {
                // shortcut for comparing two instances
                if (v[f] === value)
                    return;  // found match --> keep match unchanged
            } else {
                // follow association recursively
                if (evalExpression(m[f].$association.$class, v[f], value))
                    return;  // found match --> keep match unchanged
            }
            match = false;
        }
    });
    return "$ne" in criteria ? !match : match;
}


// evaluate condition for property value
var evalCondition = function(condition, value) {
    // condition === expr
    if (typeof condition !== 'object')
        // NOTE: direct comparison between objects is always a bad idea
        return defaultCompare(value, condition) === 0;

    // use user-supplied comparison function?
    var compare = "$using" in condition ? condition.$using : defaultCompare;

    // condition === { op: expr, op: expr, ... }
    for (var op in condition) {
        var expr = condition[op];
        switch (op) {
            // NOTE: using !(...) to handle "undefined" values
            case "$using":
                break;  // skip comparison function
            case "$eq":
                if (!(compare(value, expr) === 0)) return false;
                break;
            case "$ne":
                var res = compare(value, expr);
                if (!(res < 0 || res > 0)) return false;
                break;
            case "$lt":
                if (!(compare(value, expr) < 0)) return false;
                break;
            case "$le":
                if (!(compare(value, expr) <= 0)) return false;
                break;
            case "$gt":
                if (!(compare(value, expr) > 0)) return false;
                break;
            case "$ge":
                if (!(compare(value, expr) >= 0)) return false;
                break;
            case "$like":
                if (!islike(expr, value)) return false;
                break;
            case "$unlike":
                if (islike(expr, value) || typeof value === "undefined") return false;
                break;
            case "$null":
                if (!(isnull(value) && expr || !isnull(value) && !expr)) return false;
                break;
            case "$empty":
                throw new Error("invalid $empty operator on non-association");
            case "$none":
                throw new Error("invalid $none operator on non-association");
            default:
                throw new Error("invalid expression operator: " + op);
        }
    }
    return true;
};


// compare two primitive values semantically
function defaultCompare(lhs, rhs) {
    return lhs < rhs ? -1 : lhs > rhs ? +1 : lhs == rhs ? 0 : undefined;
};


// convert SQL LIKE pattern to regular expression
function islike(pattern, value) {
    var escaped = pattern.replace(/[-\\.^$*+?()|[\]{}]/g, '\\$&').replace(/%/g, ".*").replace(/_/g, ".");
    return (new RegExp(escaped)).test(value);
}

// check for NULL value; includes JavaScript null for associations
function isnull(value) {
    return typeof value === "undefined" || value === null;
}

// check if target instance(s) exist
function isnone(value) {
    return isnull(value) || utils.isArray(value) && value.length === 0;
}