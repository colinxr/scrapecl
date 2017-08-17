const fs         = require('fs');
const path       = require('path');
const urlMod     = require('url');
const mongoose   = require('mongoose');
const async 	   = require('async');
const Bluebird   = require('bluebird');
const rp         = require('request-promise');
const errors     = require('request-promise/errors');
const cheerio    = require('cheerio');


// import environmental variables from our variables.env file
require('dotenv').config();

var promise = mongoose.connect(process.env.DATABASE, {
  useMongoClient: true,
});
mongoose.Promise = require('bluebird');
mongoose.connection.on('error', (err) => {
  console.error(`${err.message}`);
});

//import Listing model
const Listing = require('./models/Listing');

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

rp(options) // Initial Custom Search Engine Query
  .then(data => {

    let results = data.searchInformation.totalResults; // sets total number of results
    let queryNum = Math.floor(results / data.items.length)// finds number of searchList we'll need to use to get all of the results.

    console.log(results);
    console.log(queryNum);

    console.log('Initial Query');

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

    console.log('Pushing URLs');

    for (var i = 0; i < queryNum; i++ ){ //only loop through twice in development. in production use queryNum value

      queryOptions.qs.start = start;
      start += 10;

      queryList.push(rp(queryOptions)); // sets array with request objects
    }

    console.log('Requesting JSON');

    //Split this into separate function?
    Bluebird.some(queryList, queryList.length)
      .spread(function(data){ // takes queryList array and iterates over each entry, applying the getUrls() function to it.
        let arr = data.items;
        getUrls(arr);

        if (data.nextPage.length < 1){ //if no next page exists
          console.log('no results anymore');
          return false;
        }
      })
      .catch(Bluebird.AggregateError, function(err) {
          err.forEach(function(e) {
              console.error(e.stack);
          });
      })
    .catch(err => console.log(err))
    .then(function(){
      // convert section to this? https://stackoverflow.com/questions/32463692/use-promises-for-multiple-node-requests
      console.log('Scraping Craigslist');

      urls.forEach((url, i) => { // for each url in Urls object open up a new rp with the following options
        let options = {
          uri: urls[i],
          simple: false,

          transform: function (body) { //only open up 2xx responses
            transform2xxOnly = true;
            return cheerio.load(body);
          }
        };

        rp(options)
        .then(function($) {

          let details = {};

          if ($('.postingtitle').length){// is true if post exists nad has not been deleted, removed, flagged, etc.

            let pid = urls[i].substring(urls[i].search(/[0-9]*\.html/)).replace(/\.html/, '');

            details.url = urls[i];
            details.pid = pid;
            details.title = ($('#titletextonly').text() || '').trim();
            details.desc = ($('#postingbody').text() || '').trim();
            details.lat = $('#map').attr('data-latitude');
            details.long = $('#map').attr('data-longitude');

            if ($('#thumbs').length){
              details.imgs = [];
              let imgSrc = [];

              $('#thumbs').find('a').each((i, el) => {
                imgSrc.push(($(el).attr('href') || '').trim());
              });

              console.log(details.url);
              console.log(imgSrc);

              /*details.imgs = imgSrc.map((src) => {
                imgObj = {};

                let uri = urlMod.parse(src);
                let file = path.basename(uri.path);

                let img = rp(src).pipe(fs.createWriteStream(path.join('/downloads', file)));

                imgObj.data = img;
                imgObj.contentType = 'image/jpg';

                return imgObj;
              });*/
            }
          }

          return details;
        })
        //.catch(err => console.log(err))
        .then(details => {
          if (!details.pid) { // if details object is set.
            console.log('no post at this url');
          } else {
            console.log('Saving to DB');
            let listing = new Listing(details);

            listing.save();
          }
        })
      });
    })
  })
.catch(err => console.log(err));
