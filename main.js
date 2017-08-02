const fs         = require('fs');
const mongoose   = require('mongoose');
const async 	   = require('async');
const rp         = require('request-promise');
const errors     = require('request-promise/errors');
const cheerio    = require('cheerio');


// import environmental variables from our variables.env file
require('dotenv').config();

let urls = [];

let craiglist = {

  open: function() {
    return request({
      'method': "GET",
      uri: 'https://www.googleapis.com/customsearch/v1?q=cohousing&cx=006186647395206535033%3Ayn35ydj3ohe',
      qs: {
        'key': process.env.KEY,
        'start': 1
      },
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true
    }
  });

  getUrls: function(arr){
    arr.forEach((res, i) => {
      let link = arr[i].link;

      return urls.push(link);
    });
  }
}

function req()
