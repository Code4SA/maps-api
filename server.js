// Libraries
var restify = require('restify');
var topojson = require('topojson');
var fs = require('fs');
var markdown = require( "markdown" ).markdown;

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
				geojson = JSON.parse(data);
				//Fix the field names
				for(var y = 0; y < geojson.features.length; y++) {
					var row = geojson.features[y].properties;
					var tmprow = {};
					for (property in row) {
						if (normalized_fields[demarcation][property]) {
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
				
				fs.writeFile(fname, JSON.stringify(output), function(err) {
					if (err) {
						console.log("Error saving cache file " + fname, err);
					}
					console.log("Cached " + fname);
				});
				merge_objects(result, output);
				res.json(result);
				return true;
			
		});
	} else {
		console.log("Hit cache " + fname);
		merge_objects(result, JSON.parse(data));
		res.json(result);
		return true;
	}
		// res.send(output);
		return true;
	});
}

function set_headers(res) {
	res.setHeader("Cache-Control", "no-transform,public,max-age=86400,s-maxage=86400");
}
// function fix_cors_header(req, res, next) {
// 	res.setHeader("Access-Control-Allow-Origin", "*");
// 	console.log(res.headers());
// 	res.send();
// 	next();
// }

function political(req, res, next) {
	set_headers(res);
	// res.setHeader("Access-Control-Allow-Origin", "*");
	// console.log(res.headers());
	var demarcation = req.params.demarcation;
	var year = req.params.year || "2014";
	var check = check_map(demarcation, political_maps);
	if (check !== true) {
		console.log(check);
		return next(check);
	}
	console.log('Got demarcation request /political/' + year + "/" + demarcation);
	console.log(req.params);
	//Default parameters
	var params = {
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

	var check = generate_map(year, demarcation, res, params);
	// console.log(result);
	if (check !== true) {
		// console.log(check);
		return next(check);
	}
	next();
}

function readme(req, res, next) {
	fs.readFile("API.md", "utf8", function(err, data) {
		// var md = markdown.toHTML(data);
		res.contentType="text/plain";
		res.send(data);
	});
	next();
}

//Set up server
var server = restify.createServer({
	name: 'Code4SA-Maps-API'
});
// server.use(restify.CORS({
// 	matchOrigin: false
// }));
server.use(restify.fullResponse());
server.use(restify.queryParser());
// server.use(fix_cors_header);
// Routes
server.get('/political/:demarcation', political);
// server.head('/political/:demarcation', fix_cors_header);
server.get('/political/:year/:demarcation', political);
server.get('/', readme)

//Listen for incoming connections
server.listen(8080, function() {
	console.log('Listening on port 8080');
});