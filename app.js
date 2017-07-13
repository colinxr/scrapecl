const mongoose   = require('mongoose');
const craigslist = require('node-craigslist');
const async 	   = require('async');
const request    = require('request');
const cheerio    = require('cheerio');

// import environmental variables from our variables.env file
require('dotenv').config({ path: 'variables.env' });

// Connect to our Database and handle an bad connections
mongoose.connect(process.env.DATABASE);
mongoose.Promise = global.Promise; // Tell Mongoose to use ES6 promises
mongoose.connection.on('error', (err) => {
  console.error(`${err.message}`);
});

require(__dirname + '/models/Listing');
Listing = mongoose.model('Listing');


//node-craigslist configuration
const client = new craigslist.Client({
  city: 'Toronto',
});

const options = {
  baseHost: 'craigslist.ca',
  category: 'apa'
}


// Get Listings based off configuration
client.list(options)
  .then((listings) => {

    let entries = [];

    // for each listing get base data, then open up request from listning url and scrape the rest of the data.
    listings.forEach((listing) => {
      let data = {};
      data.pid   = listing.pid;
      data.title = listing.title;
      data.price = listing.price;
      data.url   = listing.url;

      async.series([
        function(callback){
          request(data.url, function(err, res, html){
            if (!err) var $ = cheerio.load(html);

            data.desc = ($('#postingbody').text() || '').trim();
            data.mapurl = $('div.mapbox p.mapaddress')
        		  .find('a')
        		   .attr('href');

            $('#thumbs').find('a').each((i, el) => {
              data.images = data.images || [];
             	data.images.push(($(el).attr('href') || '').trim());
             });

            callback();
          })
        },

        function(callback){

          let listing = new Listing(data);

          console.log('listing object description: ' + listing.desc);

          listing.save(function(err){
            if (err) return err;
          })
        }
      ], function(err){
        if (err) return err;
      })
      //console.log(listing); // log all of the listing values
      //console.log(listing.price); get specific value, found here: https://github.com/brozeph/node-craigslist/blob/master/src/index.js
    });
  })
  .catch((err) => {
    console.log(err);
  });

// Get All of the Listings -> Just Basic Info Tho

/*client.list(options)
  .then((listings) => {
    listings.forEach((listing)) => console.log(listing);
  })
  .catch((err) => {
    console.log(err);
  });

// get full details on one listing
client.list(options)
  .then((listings) => client.details(listings[0]))
  .then((details) => {
    console.log(details);
  })
  .catch((err) => {
    console.log(err);
  });
  */
