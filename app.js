const fs         = require('fs');
const mongoose   = require('mongoose');
const async 	   = require('async');
const Bluebird   = require('bluebird');
const rp         = require('request-promise');
const errors     = require('request-promise/errors');
const cheerio    = require('cheerio');


// import environmental variables from our variables.env file
require('dotenv').config();

mongoose.connect();
var promise = mongoose.connect(process.env.DATABASE, {
  useMongoClient: true,
});
mongoose.Promise = require('bluebird');
mongoose.connection.on('error', (err) => {
  console.error(`${err.message}`);
});

//import Listing model
require('./models/Listing');

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

const getUrls = (arr) => {
  arr.forEach((res, i) => {
    let link = arr[i].link; // arr.link is the Google Custom Search Result URL -> data.items.link

    return urls.push(link);
  });
}

rp(options)
  .then(data => {
    let results = data.searchInformation.totalResults; // sets total number of results
    let queryNum = Math.ceil(results / data.items.length)// finds number of searchList we'll need to use to get all of the results.

    let queryVars = {
      options: options,
      queryNum: queryNum
    } // sets queryVars object in order to pass down the promise chain.

    return queryVars;
  })
  .then(queryVars => {
    let queryList = [];

    let start = 1;

    let queryOptions = queryVars.options;
    let queryNum = queryVars.queryNum;

    for (var i = 0; i < 1; i++ ){ //only loop through twice in development. in production use queryNum value

      queryOptions.qs.start = start;
      start += 10;

      queryList.push(rp(queryOptions)); // sets array with request objects
    }

    //Split this into separate function?

    Bluebird.map(queryList, function(data){ // takes queryList array and iterates over each entry, applying the getUrls() function to it.
      let arr = data.items;
      getUrls(arr);
    })
    .then(function(){
      console.log(urls)
    });
  })
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
      .then(details => {
        console.log(details);
      })
    });
  })
  .catch((err) => { console.error(err); })
