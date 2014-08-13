#!/usr/bin/env node

var restify = require('restify');
var topojson = require('topojson');
var fs = require('fs');

var argv = require('minimist')(process.argv.slice(2));

var help = function() {
	console.log("extrude takes a topojson map with features and merges the features based on a shared property.");
	console.log("");
	console.log("Usage:");
	console.log("extrude --filename=[topojson] --property=[property]");
}

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

if (!argv.filename || argv.filename == "") {
	console.log("Expected --filename");
	help();
	process.exit(1);
}

if (!argv.property || argv.property == "") {
	console.log("Expected --property");
	help();
	process.exit(1);
}

if (!fs.existsSync(argv.filename)) {
	console.log("Can't find file " + argv.filename);
	help();
	process.exit(1);
}
var data = fs.readFileSync(argv.filename);

var topo = JSON.parse(data);

//Get a list of items to merge by
var param_options = [];
topo.objects.demarcation.geometries.forEach(function(feature) {
	(param_options[feature.properties[argv.property]]) ? param_options[feature.properties[argv.property]]++ : param_options[feature.properties[argv.property]] = 1;
});

var merged = [];
for(val in param_options) {
	merged.push(topojson.merge(topo, topo.objects.demarcation.geometries.filter(function(d) { 
			return(d.properties[argv.property] == val)
		})
	));
}

var feature_group = {
	type: "Topology",
	features: merged
};

if(argv.output) {
	fs.writeFileSync(argv.output, JSON.stringify(feature_group));
} else {
	console.log(JSON.stringify(feature_group));
}

process.exit(0);