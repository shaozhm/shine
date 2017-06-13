var queries = require("./cds-queries");
var Expr = queries.Query.F;


/*********************************************************************************
 * Spatial methods
 *********************************************************************************/
queries.Query.F.$convexHull = geoPostfix("ST_ConvexHull", [0]);
queries.Query.F.$area = geoPostfix("ST_Area", [0,1]);
queries.Query.F.$buffer = geoPostfix("ST_Buffer", [1,2]);
queries.Query.F.$boundary = geoPostfix("ST_Boundary", [0]);
queries.Query.F.$contains = geoPostfix("ST_Contains", [1]);
queries.Query.F.$covers = geoPostfix("ST_Covers", [1]);
queries.Query.F.$coveredBy = geoPostfix("ST_CoveredBy", [1]);
queries.Query.F.$crosses = geoPostfix("ST_Crosses", [1]);
queries.Query.F.$isEmpty = geoPostfix("ST_IsEmpty", [0]);
queries.Query.F.$isSimple = geoPostfix("ST_IsSimple", [0]);
queries.Query.F.$disjoint = geoPostfix("ST_Disjoint", [1]);
queries.Query.F.$equals = geoPostfix("ST_Equals", [1]);
queries.Query.F.$overlaps = geoPostfix("ST_Overlaps", [1]);
queries.Query.F.$intersects = geoPostfix("ST_Intersects", [1]);
queries.Query.F.$centroid = geoPostfix("ST_Centroid", [0]);
queries.Query.F.$difference = geoPostfix("ST_Difference", [1]);
queries.Query.F.$dimension = geoPostfix("ST_Dimension", [0]);
queries.Query.F.$distance = geoPostfix("ST_Distance", [1,2]);
queries.Query.F.$endPoint = geoPostfix("ST_EndPoint", [0]);
queries.Query.F.$envelope = geoPostfix("ST_Envelope", [0]);
queries.Query.F.$exteriorRing = geoPostfix("ST_ExteriorRing", [0]);
queries.Query.F.$geometryType = geoPostfix("ST_GeometryType", [0]);
queries.Query.F.$geometryN = geoPostfix("ST_GeometryN", [1]);
queries.Query.F.$interiorRingN = geoPostfix("ST_InteriorRingN", [1]);
queries.Query.F.$intersection = geoPostfix("ST_Intersection", [1]);
queries.Query.F.$intersectsFilter = geoPostfix("ST_IntersectsFilter", [1]);
queries.Query.F.$intersectsRect = geoPostfix("ST_IntersectsRect", [2]);
queries.Query.F.$is3D = geoPostfix("ST_Is3D", [0]);
queries.Query.F.$isClosed = geoPostfix("ST_IsClosed", [0]);
queries.Query.F.$isRing = geoPostfix("ST_IsRing", [0]);
queries.Query.F.$isValid = geoPostfix("ST_IsValid", [0]);
queries.Query.F.$length = geoPostfix("ST_Length", [0,1]);
queries.Query.F.$numGeometries = geoPostfix("ST_NumGeometries", [0]);
queries.Query.F.$numInteriorRing = geoPostfix("ST_NumInteriorRing", [0]);
queries.Query.F.$numInteriorRings = geoPostfix("ST_NumInteriorRings", [0]);
queries.Query.F.$numPoints = geoPostfix("ST_NumPoints", [0]);
queries.Query.F.$orderingEquals = geoPostfix("ST_OrderingEquals", [1]);
queries.Query.F.$pointN = geoPostfix("ST_PointN", [1]);
queries.Query.F.$pointOnSurface = geoPostfix("ST_PointOnSurface", [0]);
queries.Query.F.$relate = geoPostfix("ST_Relate", [1]);
queries.Query.F.$srid = geoPostfix("ST_SRID", [0]);
queries.Query.F.$snapToGrid = geoPostfix("ST_SnapToGrid", [1]);
queries.Query.F.$symDifference = geoPostfix("ST_SymDifference", [1]);
queries.Query.F.$touches = geoPostfix("ST_Touches", [1]);

//queries.Query.F.$unionAggr = geoPostfix("ST_UnionAggr", [1]);
exports.unionAggr = unionAggr;

function unionAggr(arg) {
	return Expr.$geoPreOp("ST_UnionAggr", arg);
}

queries.Query.F.$startPoint = geoPostfix("ST_StartPoint", [0]);
queries.Query.F.$withinDistance = geoPostfix("ST_WithinDistance", [3]);
queries.Query.F.$within = geoPostfix("ST_Within", [1]);
queries.Query.F.$x = geoPostfix("ST_X", [0]);
queries.Query.F.$y = geoPostfix("ST_Y", [0]);
queries.Query.F.$xMax = geoPostfix("ST_XMax", [0]);
queries.Query.F.$xMin = geoPostfix("ST_XMin", [0]);
queries.Query.F.$yMax = geoPostfix("ST_YMax", [0]);
queries.Query.F.$yMin = geoPostfix("ST_YMin", [0]);

function geoPostfix(name, numArgs) {
	return function(args) {
		if (numArgs.indexOf(args.length-1) != -1) {
			return Expr.$postOp(name, args);
		}
		else {
			throw new Error("Invalid number of arguments")
		}
	};
}


/*********************************************************************************
 * Spatial geometry from string representation
 *********************************************************************************/
exports.geomFromEWKB = geomFromEWKB;
exports.geomFromEWKT = geomFromEWKT;
exports.geomFromText = geomFromText;
exports.geomFromWKB = geomFromWKB;
exports.geomFromWKT = geomFromWKT;


function geomFromEWKB(stringRep) {
	return Expr.$geoPreOp("ST_GeomFromEWKB", stringRep);
}

function geomFromEWKT(stringRep) {
	return Expr.$geoPreOp("ST_GeomFromEWKT", stringRep);
}

function geomFromText(stringRep, srid) {
	if (typeof srid === 'undefined') {
		return Expr.$geoPreOp("ST_GeomFromText", stringRep);
	}
	else {
		return Expr.$geoPreOp("ST_GeomFromText", stringRep, srid);
	}
}

function geomFromWKB(stringRep, srid) {
	if (typeof srid === 'undefined') {
		return Expr.$geoPreOp("ST_GeomFromWKB", stringRep);
	}
	else {
		return Expr.$geoPreOp("ST_GeomFromWKB", stringRep, srid);
	}
}

function geomFromWKT(stringRep, srid) {
	if (typeof srid === 'undefined') {
		return Expr.$geoPreOp("ST_GeomFromWKT", stringRep);
	}
	else {
		return Expr.$geoPreOp("ST_GeomFromWKT", stringRep, srid);
	}
}


/*********************************************************************************
 * Spatial formats
 *********************************************************************************/
queries.Query.F.$asBinary = geoFormat("Binary");
queries.Query.F.$asEWKB = geoFormat("EWKB");
queries.Query.F.$asEWKT = geoFormat("EWKT");
queries.Query.F.$asGeoJSON = geoFormat("GeoJSON");
queries.Query.F.$asSVG = geoFormat("SVG");
queries.Query.F.$asText = geoFormat("Text");
queries.Query.F.$asWKB = geoFormat("WKB");
queries.Query.F.$asWKT = geoFormat("WKT");

function geoFormat(format) {
	return function(args) {
		return Expr.$postOp("ST_As" + format, args);
	};
};


/*********************************************************************************
 * Spatial queries
 *********************************************************************************/
queries.Query.F.$query = function(args) {
	return query([args[0]]);
};

function query(exprs) {
	var q = new queries.Query(null, {t0: "DUMMY"}, "t0").$project({});
	var fields = exprs.reduce(function(acc, e, i) {
		acc["geo_" + i] = e;
		return acc;
	}, {});
	var res = q.$addFields(fields);
	return res;
}


/*********************************************************************************
 * Spatial data types
 *********************************************************************************/
exports.stPolygon = stPolygon;
exports.stMultiPoint = stMultiPoint;
exports.stLineString = stLineString;
exports.stCircularString = stCircularString;
exports.stMultiLineString = stMultiLineString;
exports.stPoint = stPoint;
exports.stMultiPolygon = stMultiPolygon;
exports.stGeometryCollection = stGeometryCollection;


function stType(constr, data, srid) {
	if (typeof data === 'undefined') {
		return Expr.$geoPreOp("NEW ST_" + constr);
	}

	if (typeof srid === 'undefined') {
		return Expr.$geoPreOp("NEW ST_" + constr, data);
	}

	return Expr.$geoPreOp("NEW ST_" + constr, data, srid);
}

function point(p) {
	return {
		type: "Point",
		coordinates : p
	};
}

function jsonPoints(points) {
	return points.map(function(p){
		return point(p);
	});
}

function jsonPoint(points) {
	return point(points);
}

function polygon(points) {
	return [{
		type: "Polygon",
		coordinates: points
	}];
}

function stLineString(points, srid) {
	return stMultiplePoints("LineString", points, srid);
}

function stCircularString(points, srid) {
	return stMultiplePoints("CircularString", points, srid);
}

function stMultiLineString(points, srid) {
	return stMultipleLines("MultiLineString", points, srid);
}

function stPolygon(points, srid) {
	return stMultipleLines("Polygon", points, srid);

}

function stPoint(point, y) {
	var textRep;
	var srid;

	//GeoJson-Object as param
	if (Object.prototype.toString.call(point) === "[object Object]") {
		if(point.coordinates) {
			point = point.coordinates;
		}
		else {
			throw new Error("GeoJSON-Object has no \'position\' property.")
		}
	}

	//point undefined --> empty constructor
	if (typeof point === 'undefined') {

	}
	//point is a number --> constructor with 2 doubles is used and 2nd param 'srid' is abused for the 2nd double value
	else if (typeof point === 'number') {
		textRep = point;
		srid = y;
	}
	//point is a string --> wkb constructor
	else if (typeof point === 'string') {
		textRep = point;
	}
	//point is described in (well known) text format with optional srid parameter
	else {
		if (!point.coordinates) {
			point = jsonPoint(point);
		}

		textRep = "Point " + '(' + point.coordinates.join(" ") + ")";
	}

	return stType("Point", textRep, srid);
}

function stMultiplePoints(type, points, srid) {
	var textRep;

	//GeoJson-Object as param
	if (Object.prototype.toString.call(points) === "[object Object]") {
		if(points.coordinates) {
			points = points.coordinates;
		}
		else {
			throw new Error("GeoJSON-Object has no \'position\' property.")
		}
	}

	//points undefined --> empty constructor
	if (typeof points === 'undefined') {

	}
	//points is a string --> wkb constructor
	else if (typeof points === 'string') {
		textRep = points;
	}
	//points are described in (well known) text format with optional srid parameter
	else {
		if (!points[0].coordinates) {
			points = jsonPoints(points);
		}

		textRep = type+'(' + points.map(function(p) {
				return p.coordinates.join(" ");
			}).join(", ")+")";
	}

	return stType(type, textRep, srid);
}

function stMultipleLines(type, lines, srid) {
	var textRep;

	//GeoJson-Object as param
	if (Object.prototype.toString.call(lines) === "[object Object]") {
		if(lines.coordinates) {
			lines = lines.coordinates;
		}
		else {
			throw new Error("GeoJSON-Object has no \'position\' property.")
		}
	}

	//lines undefined --> empty constructor
	if (typeof lines === 'undefined') {

	}
	//lines is a string --> wkb constructor
	else if (typeof lines === 'string') {
		textRep = lines;
	}
	//lines are described in (well known) text format with optional srid parameter
	else {
		if (!lines[0].coordinates) {
			lines = polygon(lines);
		}

		textRep = type + lines.map(function(points) {
				return '(' + (points.coordinates.map(function(points0) {
						return '(' +points0.map(function(p) {
								return p.join(" ");
							}).join(", ")+")";
					}).join(", "))+")";
			}).join(", ");
	}

	return stType(type, textRep, srid);
}

function stMultiPoint(points, srid) {
	var textRep;

	//GeoJson-Object as param
	if (Object.prototype.toString.call(points) === "[object Object]") {
		if(points.coordinates) {
			points = points.coordinates;
		}
		else {
			throw new Error("GeoJSON-Object has no \'position\' property.")
		}
	}

	//points undefined --> empty constructor
	if (typeof points === 'undefined') {

	}
	//points is a string --> wkb constructor
	else if (typeof points === 'string') {
		textRep = points;
	}
	//points are described in (well known) text format with optional srid parameter
	else {
		if (!points[0].coordinates) {
			points = jsonPoints(points);
		}

		textRep = "MultiPoint" + '(' + points.map(function(p) {
				return '('+p.coordinates.join(" ")+')';
			}).join(", ")+")";
	}

	return stType("MultiPoint", textRep, srid);
}

function stMultiPolygon(polygons, srid) {
	var textRep;

	//GeoJson-Object as param
	if (Object.prototype.toString.call(polygons) === "[object Object]") {
		if(polygons.coordinates) {
			polygons = polygons.coordinates;
		}
		else {
			throw new Error("GeoJSON-Object has no \'position\' property.")
		}
	}

	//polygons undefined --> empty constructor
	if (typeof polygons === 'undefined') {

	}
	//polygons is a string --> wkb constructor
	else if (typeof polygons === 'string') {
		textRep = polygons;
	}
	//polygons are described in (well known) text format with optional srid parameter
	else {
		textRep = "MultiPolygon" +'(' + polygons.map(function(lines) {
				if (!lines[0].coordinates) {
					lines = polygon(lines);
				}

				return  (lines.map(function(points) {
					return '(' + (points.coordinates.map(function(points0) {
							return '(' +points0.map(function(p) {
									return p.join(" ");
								}).join(", ")+")";
						}).join(", "))+")";
				}).join(", "));
			}).join(", ")+")";
	}

	return stType("MultiPolygon", textRep, srid);
}

function stGeometryCollection(geometries, srid) {
	var textRep;

	//GeoJson-Object as param
	if (Object.prototype.toString.call(geometries) === "[object Object]") {
		if(geometries.geometries) {
			geometries = geometries.geometries;
		}
		else {
			throw new Error("GeoJSON-Object has no \'position\' property.")
		}

		geometries = geometries.map(function(jsonGeom) {
			var geoConstr;

			switch(jsonGeom.type) {
				case "Point":
					geoConstr = stPoint(jsonGeom.coordinates);
					break;
				case "MultiPoint":
					geoConstr = stMultiPoint(jsonGeom.coordinates);
					break;
				case "LineString":
					geoConstr = stLineString(jsonGeom.coordinates);
					break;
				case "CircularString":
					geoConstr = stCircularString(jsonGeom.coordinates);
					break;
				case "MultiLineString":
					geoConstr = stMultiLineString(jsonGeom.coordinates);
					break;
				case "Polygon":
					geoConstr = stPolygon(jsonGeom.coordinates);
					break;
				case "MultiPolygon":
					geoConstr = stMultiPolygon(jsonGeom.coordinates);
					break;
				default:
					//TODO error
					break;
			}

			return geoConstr;
		})
	}

	//geometries undefined --> empty constructor
	if (typeof geometries === 'undefined') {

	}
	//geometries is a string --> wkb constructor
	else if (typeof geometries === 'string') {
		textRep = geometries;
	}
	//take representations of the geometries (in whatever format they are) as constructor parameters
	else {
		textRep = "GeometryCollection " + '(' + geometries.map(function(geo) {
				return geo._geoPreOp[1];
			}).join(', ') + ")"
	}

	//return stType(obj);
	return stType("GeometryCollection", textRep, srid);
}