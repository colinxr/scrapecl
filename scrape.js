const mongoose = require('mongoose');
const rp       = require('request-promise');
const Listing  = require('./models/Listing');


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
  getUrls: (arr, urls) => {
    arr.forEach((res, i) => {
      let link = arr[i].link; // arr.link is the Google Custom Search Result URL -> data.items.link

      urls.push(link);

      return urls;
    });
  },
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

}
