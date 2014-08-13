// Libraries
var config = require('./config');
var restify = require('restify');
var topojson = require('topojson');
var fs = require('fs');
var markdown = require( "markdown" ).markdown;
var MongoClient = require('mongodb').MongoClient;

var political_maps = ['ward', 'municipality', 'province', 'voting_district'];

var normalized_fields = {
	ward: {
		PROVINCE: "province",
		CAT_B: "municipality",
		MUNICNAME: "municipality_name",
		WARDNO: "ward_number",
		WARD_NO: "ward_number",
		WARD_ID: "ward",
		WARDID: "ward", //2006
		WARD_POP: "population",
		COUNCILLOR: "counillor", //2006
		"Area": "area"
	},
	municipality: {
		PROVINCE: "province",
		CAT_B: "municipality",
		CATEGORY: "category",
		TYPE: "category", //2006
		CAT2: "category_name",
		MUNICNAME: "municipality_name",
		COMMON_NAM: "municipality_name", //2006
		DISTRICT: "district",
		AREA: "area"
	},
	province: {
		CODE: "province",
		PROVINCE: "province_name",
		code: "province", //2006
		province: "province_name", //2006
		"Area": "area",
		hectares: "hectares" //2006
	},
	voting_district: {
		PROVINCE: "province_name",
		FKLWARDID: "ward",
		MUNICIPALI: "municipality_name",
		VDNumber: "voting_district",
		SPROVINCE: "province_name",
		PKLVDNUMBE: "voting_district",
		SMUNICIPAL: "municipality_name",
		FKLMUNICID: "municipality_id"
	}
}

var transform_fields = {
	ward: {
		province: function(s) {
			if (s == "NP") {
				return "LIM";
			}
			if (s == "GP") {
				return "GT";
			}
			return s;
		}
	}
}

function check_map(demarcation, maps) {
	var found = false;
	for(var x = 0; x < maps.length; x++) {
		if (demarcation == maps[x]) {
			found = true;
		}
	}
	if (found) {
		return true;
	}
	return new restify.InvalidArgumentError("Invalid demarcation. Valid demarcations are: " + maps.join(", "));
}

function flatten_object(objs) {
	var result = [];
	for (obj in objs) {
		if ((typeof objs[obj] != "function") && (objs[obj] !== false)) {
			if (typeof objs[obj] == "object") {
				result = result.concat(flatten_object(objs[obj]));
			} else {
				result.push(objs[obj]);
			}
		}
	}
	return result;
}

function safe_array(arr) {
	for (var x = 0; x < arr.length; x++) {
		arr[x] = encodeURIComponent(arr[x])
	}
	return arr;
}

function merge_objects(obj1, obj2) {
	// var obj3 = {};
	for (key in obj2) {
		obj1[key] = obj2[key];
	}
	// for (key in obj2) {
	// 	obj3[key] = obj1[key];
	// }
	// return obj3;
}

function find_file(year, demarcation) {
	// We might be asked for Wards 2009. However this is actually Wards 2006. So if we don't find an exact match, keep looking back until we find something, else throw an error.

	if (year < 1999) {
		return false;
	}

	var basename = "data/" + year + "/" + demarcation;
	var fname = basename + ".geojson";
	console.log("Checking for " + basename);
	if (fs.existsSync(fname)) { 
	//Direct hit
		return year;
	}
	var prevyear = year - 1;
	return find_file(prevyear, demarcation);
}

function makeMap(data, params, cachefile, result) {
	geojson = JSON.parse(data);

	demarcation = params.demarcation;
	//Fix the field names
	for(var y = 0; y < geojson.features.length; y++) {
		var row = geojson.features[y].properties;
		var tmprow = {};
		for (property in row) {
			if (normalized_fields[demarcation] && normalized_fields[demarcation][property]) {
				tmprow[normalized_fields[demarcation][property]] = row[property]; //Booya!
			}
		}
		geojson.features[y].properties = tmprow;
	}

	//Filter the Geojson
	if (params.filter) {
		var tmp = [];
		for(var y = 0; y < geojson.features.length; y++) {
			for (field in params.filter) {
				if (field in geojson.features[y].properties) {
					if (params.filter[field] instanceof Array) {
						for(var z = 0; z < params.filter[field].length; z++) {
							if (params.filter[field][z] == geojson.features[y].properties[field]) {
								// console.log(geojson.features[y].properties);
								tmp.push(geojson.features[y]);
							}
						}
					} else if (params.filter[field] == geojson.features[y].properties[field]) {
						tmp.push(geojson.features[y]);
					}
				}
			}
		}
		geojson.features = tmp;
	}

	if (params.format == "geojson") {
		merge_objects(result, geojson);
		//We send geojson as it is
		res.json(result);
		return true;
	}

	var output = topojson.topology({ demarcation: geojson }, params);
	//Cache this
	
	fs.writeFile(cachefile, JSON.stringify(output), function(err) {
		if (err) {
			console.log("Error saving cache file " + fname, err);
		}
		console.log("Cached " + fname);
	});

	merge_objects(result, output);
	// return result;
}

function generate_map(year, demarcation, res, params) {
	//Check cache
	var paramsarray = flatten_object(params);
	
	//A bit of security
	paramsarray = safe_array(paramsarray);
	
	//Find the right year
	var finalyear = find_file(year, demarcation);
	var basename = "data/" + finalyear + "/" + demarcation;
	if (!basename) {
		return new restify.InvalidArgumentError("Unable to find this demarcation for this or preceding years.");
	}
	
	//Set up a result object so we an add some extra data to it
	var result = { source: "Code4SA", year: finalyear, params: params };

	var fname = basename + "-" + paramsarray.join("-") + ".json";
	
	fs.readFile(fname, function(err, data) {
		if (err) {
			console.log("Cache miss, generating from " + basename + ".geojson");
			fs.readFile(basename + ".geojson", "utf8", function(err, data) {
				console.log(err);
				console.log("Read file");
				result = makeMap(data, params);
				res.json(result);
				return true;
			
			});
		} else {
			console.log("Hit cache " + fname);
			merge_objects(result, JSON.parse(data));
			res.json(result);
			return true;
		}
		return true;
	});
}

function defaultParams(req) {
	params = {
		format: req.params.format || "topojson",
		'coordinate-system': req.params.coordinate_system || "cartesian",
		quantization: req.params.quantization || 1000,
		id: function(d) { return d.properties[demarcation] },
		filter: req.params.filter || false,
		verbose: req.params.debug || false,
		"property-transform": function(properties, key, value) {
			properties[key] = value;
			return true;
		},
	};
	for (var p in req.params) {
		params[p] = req.params[p];
	}
	return params;
}

function political(req, res, next) {
	var demarcation = req.params.demarcation;
	var year = req.params.year || "2014";
	var check = check_map(demarcation, political_maps);
	if (check !== true) {
		return next(check);
	}
	console.log('Got demarcation request /political/' + year + "/" + demarcation);
	//Default parameters
	var params = defaultParams(req);

	var check = generate_map(year, demarcation, res, params);
	if (check !== true) {
		return next(check);
	}
	next();
}

function findGeofile(dir) {
	var files = fs.readdirSync(dir);
	for(var x = 0; x < files.length; x++) {
		if (files[x].indexOf("geojson") > 0) {
			return dir + "/" + files[x];
		}
	}
	return false;
}

function showMap(req, res, next) {
	var mapname = req.params.mapname;
	var params = defaultParams(req);

	//Set up a result object so we an add some extra data to it
	var result = { source: "Code4SA", params: params };
	var paramsarray = safe_array(flatten_object(params));
	
	var cachename = "./cache/" + paramsarray.join("-") + ".json";
	fs.readFile(cachename, function(err, data) {
		if (err) {
			console.log("Cache miss, " + cachename);
			db.collection('maps').find({ name: mapname }).toArray(function(err, data) {
				fname = "./maps" + data[0].filename;
				if (!fname) {
					return new restify.InvalidArgumentError("Unable to find the files for this map.");
				}
				fs.readFile(fname, "utf8", function(err, data) {
					console.log("Read file");
					makeMap(data, params, cachename, result);
					res.json(result);
					return true;
				});
			});
			
			
			
		} else {
			console.log("Cache hit, " + cachename);
			merge_objects(result, JSON.parse(data));
			res.json(result);
			return true;
		}
	});
	// res.json("Hello")
}

function showMapOptions(req, res, next) {
	var tmp = [];
	var collection = db
		.collection('maps')
		.find({})
		.toArray(function(err, docs) {
			res.json(docs);
			next();
    	});
}

function readme(req, res, next) {
	fs.readFile("API.md", "utf8", function(err, data) {
		res.contentType="text/plain";
		res.send(data);
	});
	next();
}

function fix_cors_header(req, res, next) {
	res.setHeader("Cache-Control", "no-transform,public,max-age=86400,s-maxage=86400");
	next();
}

var db = null;
function mongoConnect(req, res, next) {
	MongoClient.connect('mongodb://127.0.0.1:27017/' + config.mongodb, function(err, localdb) {
		if(err) throw err;
		db = localdb;
		checkDbExists();
		next();	
	});
	
}

function checkDbExists() {
	var test = db.collection('maps').find({}).toArray(function(err, docs) {
		if (err) throw err;
		if (!docs.length) {
			console.log("Could not find maps database");
			var defaultData = require('./default');
			db.collection('maps').insert(defaultData.maps, function(err, docs) {
				if (err) throw err;
				console.log("Created maps database");
			})
		}
	})
}

function createDB() {
	MongoClient.connect('mongodb://127.0.0.1:27017/' + config.mongodb, function(err, localdb) {
		if(err) throw err;
		var defaultData = require('./default');

		localdb.collection('maps').drop();
		localdb.collection('maps').insert(defaultData.maps, function(err, docs) {
			if (err) throw err;
			console.log("Created maps database");
		});
	});
}

//Set up server
var server = restify.createServer({
	name: config.serverName
});
createDB();
server.use(restify.fullResponse());
server.use(restify.queryParser());
server.use(fix_cors_header);
server.use(mongoConnect);

// Old Routes [DEPRECATED]
server.get('/political/:demarcation', political);
server.get('/political/:year/:demarcation', political);

// Country/region Routes
server.get('/map/:mapname', showMap);
server.get('/map', showMapOptions);

// Default route
server.get('/', readme)



//Listen for incoming connections
server.listen(config.port, function() {
	console.log('Listening on port ' + config.port);
});