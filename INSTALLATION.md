# Code4SA Maps API Installation Guide

## Requirements

- Node.js
	- Topojson
	- Restify
	- Markdown
- GDAL Python libraries
- Python

## Setting up

I'm assuming you've got Node.js and npm running already. If not, we suggest using Homebrew on Mac and the Chris Lea repo for Ubuntu. 

For more info, see here: https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager

### Node libraries

```
npm install topojson
npm install restify
npm install markdown
```

### Python libraries

This is only needed if you want to use the shp2geojson tool.

```
sudo easy_install GDAL
```

## Data directories

Data directories are stored under ./data, by year. These contain geojson files, as well as the cached topojson files. So you need to make sure that they're writable by your user:

```
chown -R code4sa:code4sa data
```

Don't forget to replace "code4sa" for a valid user on your system.

A few geojson maps come with the system, but a lot of these are too big to include and need to be added manually, in particular wards and voting districts. You can either download the files from the demarcations board (or wherever) or download through the API using the "format=geojson" option, and saving them as [demarcation].geojson. (Note that it's singular, eg. "ward.geojson", "municipality.geojson".)

## Running the API

This is the easy part.

```
node server.js
```
