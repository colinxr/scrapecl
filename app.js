const fs         = require('fs');
const mongoose   = require('mongoose');
const async 	   = require('async');
const rp         = require('request-promise');
const errors     = require('request-promise/errors');
const cheerio    = require('cheerio');


// import environmental variables from our variables.env file
require('dotenv').config();

let urls = [];
let queryNum;

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


let getUrls = (arr) => {
  arr.forEach((res, i) => {
    let link = arr[i].link;

    return urls.push(link);
  });
}

rp(options)
  .then(data => {
    let results = data.searchInformation.totalResults; // gets total number of results
    let queryNum = Math.floor(results / data.items.length); // finds number of queries we'll need to use to get all of the results. Math.floor is used because we've already done one query.
    let queryVars = {
      options: options,
      queryNum: queryNum
    } // sets queryVars object in order to pass down the promise chain.

    let arr = data.items;
    getUrls(arr); // push data.

    return queryVars;
  })
  .then(function(queryVars){
    let queries = [];

    let start = 11;

    let queryOptions = queryVars.options;
    let queryNum = queryVars.queryNum;

    for (var i = 0; i < queryNum; i++ ){

      queryOptions.qs.start = start;
      start += 10;

      queries.push(rp(queryOptions));
    }

    console.log(queries);

  /*  Promise.all(queries)
    .then((data) => {
      getUrls(arr);
      console.log(urls.length);
    })
    .catch(err => console.log(err));  // First rejected promise*/
  })
  .then(function(){

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

          //console.log(details);
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
