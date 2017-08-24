const fs         = require('fs');
const mongoose   = require('mongoose');
const async 	   = require('async');
const Bluebird   = require('bluebird');
const rp         = require('request-promise');
const errors     = require('request-promise/errors');
const cheerio    = require('cheerio');


// import environmental variables from our variables.env file
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
const scrape = require('./scrape');


let urls = [];

const getUrls = (arr) => {
  arr.forEach((res, i) => {
    let link = arr[i].link; // arr.link is the Google Custom Search Result URL -> data.items.link

    return urls.push(link);
  });
}

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
    return scrape.init(data)
  })
  .then(queryVars => {
    console.log('getting urls for promises');
    let queries = [];
    let start = 1;
    let queryOptions = queryVars.options;
    let queryNum = queryVars.queryNum;

    queryOptions.simple = false;
    queryOptions.transform2xxOnly = true;
    queryOptions.transformWithFullResponse = true;

    for (let i = 0; i < queryNum; i++ ){ //only loop through twice in development. in production use queryNum value

      queryOptions.qs.start = start;
      start += 10;

      queries.push(rp(queryOptions)); // sets array with request objects
    }

    console.log('queries length: ' + queries.length);
    // Split this into separate function?

    return queries;
  })
  .then(queries => { 
    let promises = queries.map(query => rp(query));

    Bluebird.all(promises)
      .then((responses) => {
        responses.map((page) => {

          if (page.error) console.log('error here');

          if (page.searchInformation.totalResults > 0) {
            console.log('fuck yeah');
            let arr = page.items;
            getUrls(arr);
          } else {
            console.log('nothing to see here');
          }
        }); // end of responses.map();
      })
      .catch((err) => {
        console.error(err);
      }) // error handling for Bluebird.all();
      .then(function(){
          console.log(urls);
          // convert section to this? https://stackoverflow.com/questions/32463692/use-promises-for-multiple-node-requests

          urls.forEach((url, i) => { // for each url in Urls object open up a new rp with the following options
            let options = {
              uri: urls[i],
              simple: false,

              transform: function(body) { //only open up 2xx responses
                transform2xxOnly = true;
                return cheerio.load(body);
              }
            };

            rp(options)
            .then(function($){

              let details = {};

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

              return details;
            })
            .then(details => {
              if (!details.pid && !details.imgs){
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

              return details;

            })
            .then(details => {
              if (!details.pid) { // if details object is set.
                console.log('no post at this url');
              } else {
                console.log('success');

                // if pid exists update
                let listing = new Listing(details);

                listing.save();
              } // if no details.pid
            })
          });// end of urls.forEach
        })
        .catch(errors.StatusCodeError, (reason) => {
          console.log('Error: ' + reason.statusCode);
        })
      })
    .catch(err => console.log(err));
