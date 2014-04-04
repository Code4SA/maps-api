// Libraries
var restify = require('restify');
var topojson = require('topojson');
var fs = require('fs');

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

function generate_map(demarcation, res, params) {
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
			res.send(geojson);
			return true;
		}
		var output = topojson.topology({ demarcation: geojson }, params);
		// var simple = topojson.simplify(topology);
		// res.send(simple);
		// console.log(topology.objects.collection);
		
		// simple = topojson.simplify(topology, {
  //       "retain-proportion": 1,
  //       "coordinate-system": "cartesian",
  //     	});
		// var arcs = [];
		// console.log(geojson.geometries.length);
		// for(var x = 0; x < geojson.geometries.length; x++) {
		// 	for (var y = 0; y < geojson.geometries[x].arcs.length; y++) {
		// 		arcs.push(geojson.geometries[x].arcs[y]);
		// 	}
		// }
		// var objects = {};
		// objects[demarcation] = geojson;
		res.send(output);
		// res.send(topology.objects.collection);
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

//Set up server
var server = restify.createServer();
server.use(restify.CORS());
server.use(restify.queryParser());

// Routes
server.get('/political/:demarcation', political);

//Listen for incoming connections
server.listen(8080, function() {
	console.log('Listening on port 8080');
});