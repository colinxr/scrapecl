const fs         = require('fs');
const mongoose   = require('mongoose');
const async 	   = require('async');
const Bluebird   = require('bluebird');
const rp         = require('request-promise');
const errors     = require('request-promise/errors');
const cheerio    = require('cheerio');


// import environmental variables from our variables.env file
require('dotenv').config();

let urls = [];

let options = {
  uri: 'https://www.googleapis.com/customsearch/v1?q=cohousing&cx=006186647395206535033%3Ayn35ydj3ohe',
  qs: {
    'key': process.env.KEY,
    'start': 1
  },
  headers: {
    'User-Agent': 'Request-Promise'
  },
    json: true
};

const setQueryVars = (json) => {
  let results = json.searchInformation.totalResults; // sets total number of results
  let queryNum = Math.ceil(results / json.items.length)// finds number of queryList we'll need to use to get all of the results.

  let queryVars = {
    options: options,
    queryNum: queryNum
  } // sets queryVars object in order to pass down the promise chain.

  return queryVars;
}

const getUrls = (arr) => {
  arr.forEach((res, i) => {
    let link = arr[i].link;

    return urls.push(link);
  });
}

const searchList = (obj) => {
  let queryList = [];

  let start = 1;

  let queryOptions = obj.options;
  let queryNum = obj.queryNum;

  for (var i = 0; i < 3; i++ ){ //only loop through twice in development. in production use queryNum value

    queryOptions.qs.start = start;
    start += 10;

    queryList.push(rp(queryOptions)); // sets array with request objects
  }

  Bluebird.map(queryList, function(data){ // takes queryList array and iterates over each entry, applying the getUrls() function to it.
    let arr = data.items;
    getUrls(arr);
  })
  .then(function(){
    console.log(urls)
  });
}

rp(options)
  .then(setQueryVars(body))
  .then(searchList(queryVars))
  .then(function(){

    // convert section to this? https://stackoverflow.com/questions/32463692/use-promises-for-multiple-node-requests
    urls.forEach((url, i) => {
      let options = {
        uri: urls[i],
        simple: false,

        transform: function (body) {
          transform2xxOnly = true;
          return cheerio.load(body);
        }
      };

      rp(options)
      .then(function($) {

        if ($('.postingtitle').length > 0){
          let details = {};

          let pid = urls[i].substring(urls[i].search(/[0-9]*\.html/)).replace(/\.html/, '');

          details.url = urls[i];
          details.pid = pid;
          details.title = ($('#titletextonly').text() || '').trim();
          details.desc = ($('#postingbody').text() || '').trim();
          details.lat = $('#map').attr('data-latitude');
          details.long = $('#map').attr('data-longitude');

        }

      })
      .catch(errors.StatusCodeError, function (reason) {
        // The server responded with a status codes other than 2xx.
        // Check reason.statusCode
        console.log(reason.statusCode);
      })
      .catch(errors.RequestError, function (reason) {
        // The request failed due to technical reasons.
        // reason.cause is the Error object Request would pass into a callback.
        console.log(reason.cause);
	     });
    });
  })
  .catch((err) => { console.error(err); })
