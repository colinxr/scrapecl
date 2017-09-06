const fs       = require('fs');
const mongoose = require('mongoose');
const rp       = require('request-promise');
const cheerio  = require('cheerio');

const Listing  = require('../models/Listing');

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

    for (let i = 0; i < queryNum; i++ ){ //only loop through twice in development. in production use queryNum value

      queryOptions.qs.start = start;
      start += 10;

      queries.push(rp(queryOptions)); // sets array with request objects
    }

    console.log('queries length: ' + queries.length);
    // Split this into separate function?

    return queries;
  },

  checkApi: responses => {

    checkObj = el => {
      return typeof el === 'object';
    };

    if (responses.every(checkObj)) { // check if responses is an array of objects rather than strings
      console.log('API fed correct data format');
    } else {
      console.log('There\'s a string! Fuck!');

    }
    //console.log(responses);
    return responses;
  },

  getUrls: (arr, urls) => {
    arr.forEach((res, i) => {
      let link = arr[i].link; // arr.link is the Google Custom Search Result URL -> page.items.link

      urls.push(link);
    });
  },

  cleanUrls: urls => {
    console.log(urls);
    let listings = urls.filter(url => { // takes URLs array and filters out any item that has 'search' in the URL. Returns new Listings array.
      if (url.includes('search')){
        console.log('this is a search page');
      }else{
        console.log('this is a listing page');
        return url;
      }
    });
    return listings;
  },

  scrapeCl: $ => {
    console.log('opening requests');

    let details = {};

    if ($('.postingtitle').length > 0){// is true if post exists and has not been deleted, removed, flagged, etc.

      let url = $('link[rel="canonical"]').attr('href');
      console.log('url: ' + url);

      let pid = url.substring(url.search(/[0-9]*\.html/)).replace(/\.html/, '');
      console.log('pid: ' + pid);

      details.url   = url;
      details.pid   = pid;
      details.title = ($('#titletextonly').text() || '').trim();
      details.desc  = ($('#postingbody').text() || '').trim();
      details.lat   = $('#map').attr('data-latitude');
      details.long  = $('#map').attr('data-longitude');
      details.date = new Date($('timeago').attr('datetime'));

      // populate posting photos
      $('#thumbs').find('a').each((i, el) => {
        details.imgs = details.imgs || [];
        details.imgs.push(($(el).attr('href') || '').trim());
      });
    } else {
      console.log('no post here');
    }

    return details;
  },

  getImgs: details => {
    if (!details.pid && !details.imgs){
      console.log('no images');
    } else {
      let dir = './imgs/' + details.pid;
      let imgs = details.imgs;

      if (!fs.existsSync(dir)){ // check if directory exists
        fs.mkdirSync(dir);

        imgs.forEach((img, i) => { // for each url ing imgs array, open up a request and write the file to directory
          let options = {
            uri: img,
            simple: false
          };

          let file = img.substr(img.lastIndexOf('/') + 1);

          rp(options)
            .pipe(fs.createWriteStream(dir + '/' + file));
        });
      } else {
        console.log('imgs already downloaded');
      }
    }

    return details;
  },

  saveListing: details => {
    if (details.pid) { // if details object is set.

      //let query = Listing.findOne({pid: details.pid}); // check if listing already exists in mongoose

      //if (!query) { // if no listing in directory save the entry
        console.log('success');

        // if pid exists update
        let listing = new Listing(details);

        listing.save();
    //  } else {
        //console.log('duplicate entry');
      //}
    } // if no details.pid
  }
}
