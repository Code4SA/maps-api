# Deprecation notice

This API is deprecated and will be removed by the end of 2015. Please use http://mapit.code4sa.org/ instead.

# Code4SA Maps API

The Code4SA Maps API provides a machine-readable dataset sourced from the Demarations Board of South Africa. It allows you to build a news application, a web page, or any other type of software (or hardware, if you're so inclined) that needs SA map data.

This page will discuss what data are available, how you're allowed to use our API, and show some examples of this API being used in the wild. It does not go into the technical details of how to access the API.

If you are a developer and you'd like to dive into the code, go straight to the documenation or examples pages.

## Data Source

This project implements an HTTP api wrapper around the South African spatial data provided
by the Demarcations Board (http://www.demarcation.org.za/) and the IEC (http://www.elections.org.za/).

## Let's get started!

The easiest way to use the API is to use our hosted service. Check out the [Terms of Service](#ToS) and if you're happy that you comply, have a look at our [API documentation](API.md) to plug in to the data. 

If you'd rather run the service on your own server, check out the [Installation documentation](INSTALLATION.md).

## What's available?

We have Provinces, Municipalities, Wards and Voting Districts. The meta-data for each is decribed below.

### Provinces

There are nine provinces.

### Municipalities

There are 234 municipalities.

### Wards

There are 4,277 wards.

### Voting Districts

There are 20,859 voting districts.

##<a name="ToS"></a> Terms of Service

There's very little restriction on how you can use the API. Whether you use it for good or evil is entirely up to you. We do have some restrictions:

### Attribution

The API service is licensed under a [Creative Commons Attribution 4.0 International License](http://creativecommons.org/licenses/by/4.0/). You must attribute us, preferably with a link to the [Code4SA website](http://www.code4sa.org), and if possible display our [logo](http://www.code4sa.org/img/logo.png).

### Rate Limits

We currently have no rate limits. If, however, you're klapping our servers and we feel that you're not playing nicely, we reserve the right to either rate limit you or just lock you out.

We are considering commercial offerings with higher or unlimited rates. At the moment, everything is free for as much as you can eat, so enjoy it while we still feel benevolent.

# Deployment

This app runs on Dokku on a Code4SA server. This environment is compatible with Heroku and can also be run there. We've found that the memory limit for free Heroku apps isn't sufficient for this app, hence Dokku.

To deploy:

Create the app on Dokku

Set the configs:
```bash
dokku config:set election-api NEW_RELIC_APP_NAME="Maps" \
                              NEW_RELIC_LICENSE_KEY=some-license-key \
```
```bash
git remote add dokku dokku@dokku2.code4sa.org:maps
git push dokku
```
