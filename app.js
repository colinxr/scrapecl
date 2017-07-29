const fs         = require('fs');
const mongoose   = require('mongoose');
const async 	   = require('async');
const rp         = require('request-promise');
const errors     = require('request-promise/errors');
const cheerio    = require('cheerio');


// import environmental variables from our variables.env file
require('dotenv').config();

let urls = [];

let options = {
  uri: 'https://www.googleapis.com/customsearch/v1?q=cohousing&cx=006186647395206535033%3Ayn35ydj3ohe&key=' + process.env.KEY,
  headers: {
    'User-Agent': 'Request-Promise'
  },
    json: true
};

rp(options)
  .then(data => {
    let arr = data.items;

    arr.forEach(function (res, i){
      let link = arr[i].link;

      urls.push(link);
    })
  })
  .then(function(){

    console.log(urls);

    urls.forEach(function(url, i){
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

          console.log(details);
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
