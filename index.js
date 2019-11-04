// index.js

const path = require("path");
const express = require("express");

const app = express();
const port = process.env.PORT || "8000";

var gtfsrb = require('gtfs-realtime-bindings');
var request = require('request');
//var protobuf = require('protobufjs');

var requestSettings = {
  method: 'GET',
  url: 'https://gtfsrt.api.translink.com.au/Feed/SEQ',
  encoding: null
};

var sunbus = {}

request(requestSettings, function (error, response, body) {
  if (!error && response.statusCode == 200) {
    var feed = gtfsrb.transit_realtime.FeedMessage.decode(body);
    var busCount = 0;

    // for each bus in the GTFS feed, iterate the RT data
    feed.entity.forEach(function(entity) {
      var bus = {};
      if (/SUN\s/.test(entity.id)) {
        busCount ++;
        // create a bus array
        bus['id'] = entity.id;
        if (entity.tripUpdate) {
          // create the stops object and iterate through the time entries for each
          var stops = {};
          entity.tripUpdate.stopTimeUpdate.forEach(function(stopData) {
            var stop = {};
            stop['stopId'] = stopData.stopId;
            stop['sequence'] = stopData.stopSequence;
            if(stopData.arrival) {
              stop['arr_delay'] = stopData.arrival.delay;
              stop['arr_time'] = stopData.arrival.time.low;
            };
            if(stopData.departure) {
              stop['dep_delay'] = stopData.departure.delay;
              stop['dep_time'] = stopData.departure.time.low;
            };
            stops[stop.sequence] = JSON.stringify(stop);
          });
          if (entity.tripUpdate.trip) {
            bus['route'] = entity.tripUpdate.trip.routeId.substring(0,3);
          }
          bus['stops'] = stops;
        }
        sunbus[busCount] = bus;
      }
    });
  }
  // return a JSON array of busses and stop data
  console.log(sunbus);
});

app.get("/", (req, res) => {
  res.status(200).send("GTFS Dev Demo");
});

app.listen(port, () => {
  console.log(`Listening to requests on http://localhost:${port}`);
});

