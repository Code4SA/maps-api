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
http://maps.code4sa.org/political/[map type]?filter[PROVINCE]=EC
http://maps.code4sa.org/political/[map type]?filter[PROVINCE]=EC&filter[PROVINCE]=WC
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
| CODE     		| EC, WC... 	|
| PROVINCE 		| Eastern Cape 	|
| Area     		| A number 		|
| Shape_Leng	| A number 		|
| Shape_Area 	| A number 		|
| Level     	| 0 			|

### Municipalities

| Property 		| Example 		|
| -------- 		| ------- 		|
| PROVINCE     	| EC, WC... 	|
| CATEGORY 		| A, B			|
| CAT_2 		| Local Municiaplity, Metropolitan Municipality			|
| CAT_B 		| CPT, NC048	|
| MUNICNAME 	| Langeberg, City of Cape Town |
| MAP_TITLE 	| MUNICNAME + CAT_2	|
| DISTRICT 		| DC1			|
| MUN_CD 		| (NC071), (CPT)|
| AREA     		| A number 		|
| Shape_Leng	| A number 		|
| Shape_Area 	| A number 		|
| Level     	| 1 			|

### Wards

| Property 		| Example 		|
| -------- 		| ------- 		|
| PROVINCE     	| EC, WC... 	|
| CAT_B 		| CPT, NC048	|
| MUNICNAME 	| Langeberg, City of Cape Town |
| WARDNO 		| 1, 2, 3...	|
| WARD_ID 		| 10101008		|
| WARD_POP 		| A Number		|
| Area     		| A number 		|
| Shape_Leng	| A number 		|
| Shape_Area 	| A number 		|
| Level     	| 3 			|

### Voting Districts

| Property 		| Example 		|
| -------- 		| ------- 		|
| PROVINCE     	| Eastern Cape 	|
| MUNICIPALI 	| EC101 - Camdeboo [Graaf-Reneit]	|
| MUNICNAME 	| Langeberg, City of Cape Town |
| FKLWARDID 	| A number		|
| VDNumber 		| 10020014		|