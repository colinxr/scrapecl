const fs         = require('fs');
const mongoose   = require('mongoose');
const async 	   = require('async');
const Bluebird   = require('bluebird');
const rp         = require('request-promise');
const errors     = require('request-promise/errors');
const cheerio    = require('cheerio');

// import environmental variables from .env file
require('dotenv').config();

let promise = mongoose.connect(process.env.DATABASE, {
  useMongoClient: true,
});
mongoose.Promise = require('bluebird');
mongoose.connection.on('error', (err) => {
  console.error(`${err.message}`);
});

//import Listing model
const Listing = require('./models/Listing');

let urls = [];

//import modules
const scrape = require('./scrape');

let options = {
  uri: process.env.URL,
  qs: {
    'key': process.env.KEY,
    'start': 1
  },
  headers: {
    'User-Agent': 'Request-Promise'
  },
  json: true
};

rp(options) // Initial Custom Search Engine Query
  .then(data => {
    return scrape.init(data);
  })
  .then(queryVars => { // Creates an array of request-promises which we pass into next .then();
    return scrape.queryPush(queryVars);
  })
  .then(queries => { // Opens each query brought forward and accesses responses using Bluebird.all();
    let promises = queries.map(query => rp(query)); //for each query in queries use .map() to open up the request-promise

    return Bluebird.all(promises)
      .then(responses => { //all of the responses are stored in one JSON object I've called responses
        return scrape.checkApi(responses);
      })
      .then(responses => {
        responses.map(page => { // use .map() to iterate over each item in resposnes, using the .getUrls method to conditionally scrape the craigslist ads from google

          if (page.searchInformation === undefined) {
            console.log('page.searchInformation still undefined');
          }

          if (!page.error) {

            if (page.searchInformation.totalResults > 0) {
              console.log('fuck yeah');
              let arr = page.items;

              return scrape.getUrls(arr, urls);  // return an array of craigslist URLs to use in next .then()
            } else {
              console.log('nothing to see here');
            }
          }

        }); // end of responses.map();

        return urls;
      })
      .catch(errors.StatusCodeError, (reason) => {
        console.log('Error: ' + reason);
      }) // error handling for Bluebird.all();
    })
    .then(urls => {
      return scrape.cleanUrls(urls);
    })
    .then(listings => {
      console.log(listings);

      listings.forEach((listing, i) => { // for each URL in urls object open up a new rp with the following options
        let options = {
          uri: listing,
          simple: false,

          transform: function(body) { //only open up 2xx responses
            transform2xxOnly = true;
            return cheerio.load(body);
          }
        };

        rp(options)
        .then($ => {
          return scrape.scrapeCl($);

          /*let details = {};

          if ($('.postingtitle').length > 0){// is true if post exists nad has not been deleted, removed, flagged, etc.

            let pid = urls[i].substring(urls[i].search(/[0-9]*\.html/)).replace(/\.html/, '');

            details.url = urls[i];
            details.pid = pid;
            details.title = ($('#titletextonly').text() || '').trim();
            details.desc = ($('#postingbody').text() || '').trim();
            details.lat = $('#map').attr('data-latitude');
            details.long = $('#map').attr('data-longitude');

            // populate posting photos
          	$('#thumbs').find('a').each((i, el) => {
          		details.imgs = details.imgs || [];
          		details.imgs.push(($(el).attr('href') || '').trim());
          	});
          }

          return details;*/
        })
        .then(details => {
          return scrape.getImgs(details);

          /*if (!details.pid && !details.imgs){
            console.log('no images');
          } else {
            let dir = './imgs/' + details.pid;

            if (!fs.existsSync(dir)){
              fs.mkdirSync(dir);
            }

            let imgs = details.imgs;

            imgs.forEach((img, i) => {
              let options = {
                uri: img,
                simple: false
              };

              let file = img.substr(img.lastIndexOf('/') + 1);

              rp(options)
                .pipe(fs.createWriteStream(dir + '/' + file));

            });
          }

          return details;*/

        })
        .then(details => {
          return scrape.saveListing(details);
          /*if (details.pid) { // if details object is set.
            console.log('success');

            // if pid exists update
            let listing = new Listing(details);

            listing.save();
          } // if no details.pid*/
        })
      });// end of urls.forEach
    })
    .catch(errors.StatusCodeError, (reason) => {
      console.log('Error: ' + reason.statusCode);
    })
    .catch(err => {
      console.log(err);
    });
