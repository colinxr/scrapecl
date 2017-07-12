const mongoose = require('mongoose');
const craigslist = require('node-craigslist');

let client = new craigslist.Client({
  baseHost: 'craigslist.ca',
  city: 'Vancouver',
  category: 'apa'
});

client.list()
  .then((listings) => {
    listings.forEach((listing) => console.log(listing));
  })
  .catch((err) => {
    console.log(err);
  });
