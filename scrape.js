const mongoose = require('mongoose');
const rp       = require('request-promise');
const cheerio  = require('cheerio');

const Listing  = require('./models/Listing');

const getUrls = (arr) => {
  arr.forEach((res, i) => {
    let link = arr[i].link; // arr.link is the Google Custom Search Result URL -> data.items.link

    return urls.push(link);
  });
}

const init = json => {
  console.log('initial request');
  let results = json.searchInformation.totalResults; // sets total number of results
  let queryNum = Math.floor(results / json.items.length)// finds number of searchList we'll need to use to get all of the results.

  let queryVars = {
    options: {
      uri: process.env.URL,
      qs: {
        'key': process.env.KEY,
        'start': 1
      },
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true
    },
    queryNum: queryNum
  } // sets queryVars object in order to pass down the promise chain.

  return queryVars;
}

const queryPush = obj => {
  console.log('getting urls for promises');
  let queries = [];
  let start = 1;
  let queryOptions = obj.options;
  let queryNum = obj.queryNum;

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
}

module.exports = {
  init: json => {
    console.log('initial request');
    let results = json.searchInformation.totalResults; // sets total number of results
    let queryNum = Math.floor(results / json.items.length)// finds number of searchList we'll need to use to get all of the results.

    let queryVars = {
      options: {
        uri: process.env.URL,
        qs: {
          'key': process.env.KEY,
          'start': 1
        },
        headers: {
          'User-Agent': 'Request-Promise'
        },
        json: true
      },
      queryNum: queryNum
    } // sets queryVars object in order to pass down the promise chain.

    return queryVars;
  },

  queryPush: obj => {
    console.log('getting urls for promises');
    let queries = [];
    let start = 1;
    let queryOptions = obj.options;
    let queryNum = obj.queryNum;

    queryOptions.simple = false;
    queryOptions.transform2xxOnly = true;
    queryOptions.transformWithFullResponse = true;

    for (let i = 0; i < 4; i++ ){ //only loop through twice in development. in production use queryNum value

      queryOptions.qs.start = start;
      start += 10;

      queries.push(rp(queryOptions)); // sets array with request objects
    }

    console.log('queries length: ' + queries.length);
    // Split this into separate function?

    return queries;
  },

  getUrls: (arr, urls) => {

    arr.forEach((res, i) => {
      let link = arr[i].link; // arr.link is the Google Custom Search Result URL -> page.items.link

      urls.push(link);
    });
  },

  scrapeCl: ($, urls) => {
    console.log('opening requests');

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

    console.log(pid);

    return details;
  },

  getImgs: (details) => {
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
  },

  saveListing: details => {
    if (details.pid) { // if details object is set.
      console.log('success');

      // if pid exists update
      let listing = new Listing(details);

      listing.save();
    } // if no details.pid
  }
}
