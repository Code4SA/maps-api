// Libraries
var restify = require('restify');
var topojson = require('topojson');
var fs = require('fs');
var markdown = require( "markdown" ).markdown;

var political_maps = ['ward', 'municipality', 'province'];
var id_fields = {
	ward: "WARD_ID",
	municipality: "CAT_B",
	province: "CODE"
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

function generate_map(demarcation, res, params) {
	//Check cache
	var paramsarray = flatten_object(params);
	var fname = "data/" + demarcation + "/" + params.format + "/" + demarcation + "-" + paramsarray.join("-") + ".json"; //Putting params.format straight into the url - Could this be a security risk?
	fs.readFile(fname, function(err, data) {
		if (err) {
			fs.readFile("data/" + demarcation + "/geojson/" + demarcation + ".json", "utf8", function(err, data) {
				geojson = JSON.parse(data);
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
					//We send geojson as it is
					res.json(geojson);
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
				res.json(output);
				return true;
			
		});
	} else {
		console.log("Hit cache " + fname);
		res.json(JSON.parse(data));
		return true;
	}
		// res.send(output);
	return true;
	});
}

function political(req, res, next) {
	var demarcation = req.params.demarcation;
	check = check_map(demarcation, political_maps);
	if (check !== true) {
		return next(check);
	}
	console.log('Got demarcation request ' + demarcation);
	console.log(req.params);
	//Default parameters
	var params = {
		format: req.params.format || "topojson",
		'coordinate-system': req.params.coordinate_system || "cartesian",
		quantization: req.params.quantization || 1000,
		id: function(d) { return d.properties[id_fields[demarcation]] },
		filter: req.params.filter || false,
		verbose: req.params.debug || false,
		"property-transform": function(properties, key, value) {
			properties[key] = value;
			return true;
		},
	};

	generate_map(req.params.demarcation, res, params);
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
var server = restify.createServer();
server.use(restify.CORS());
server.use(restify.queryParser());

// Routes
server.get('/political/:demarcation', political);
server.get('/', readme)

//Listen for incoming connections
server.listen(8080, function() {
	console.log('Listening on port 8080');
});