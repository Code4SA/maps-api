# Code4SA Maps API - API documentation

## Map Type
You can access province, municipal or ward data as follows:
```
http://maps.code4sa.org/political/[map type]
```

For instance, ward data could be accessed as follows:
```
http://maps.code4sa.org/political/ward
```

## Format
You can specify Topojson (default) or Geojson results:
```
http://maps.code4sa.org/political/[map type]?format=geojson
http://maps.code4sa.org/political/[map type]?format=topojson
```

## Filter
You can filter by property:
```
http://maps.code4sa.org/political/[map type]?filter[KEY]=VALUE
http://maps.code4sa.org/political/[map type]?filter[province]=EC
http://maps.code4sa.org/political/[map type]?filter[province]=EC&filter[province]=WC
```

## Quantization
You can specify the quantization (default 1000):
```
http://maps.code4sa.org/political/[map type]?quantization=1000
```

## Coordinate System
You can specify the coordinate system:
```
http://maps.code4sa.org/political/[map type]?coordinate_system=cartesian (default)
http://maps.code4sa.org/political/[map type]?coordinate_system=spherical
```

## Properties

We have Provinces, Municipalities, Wards and Voting Districts. The meta-data for each is decribed below.

### Provinces

| Property 		| Example 		|
| -------- 		| ------- 		|
| province		| EC, WC... 	|
| province_name	| Eastern Cape 	|
| area     		| A number 		|

### Municipalities

| Property 		| Example 		|
| -------- 		| ------- 		|
| province     	| EC, WC... 	|
| category 		| A, B			|
| category_name | Local Municiaplity, Metropolitan Municipality			|
| municipality 	| CPT, NC048	|
| municipality_name | Langeberg, City of Cape Town |
| district 		| DC1			|
| area     		| A number 		|

### Wards

| Property 		| Example 		|
| -------- 		| ------- 		|
| province     	| EC, WC... 	|
| municipality 	| CPT, NC048	|
| municipality_name | Langeberg, City of Cape Town |
| ward_number 	| 1, 2, 3...	|
| ward 			| 10101008		|
| population 	| A Number		|
| area     		| A number 		|

### Voting Districts

*Still coming*

| Property 		| Example 		|
| -------- 		| ------- 		|
| province     	| Eastern Cape 	|
| municipality_name | Langeberg, City of Cape Town |
| ward 			| A number		|
| voting_district	| 10020014		|