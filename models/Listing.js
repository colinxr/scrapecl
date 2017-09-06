// grab the mongoose module
var mongoose = require('mongoose');
var Schema 	 = mongoose.Schema;

// define our nerd model
// module.exports allows us to pass this to other files when it is called
var listingSchema = new Schema({
  pid: {
    type: String,
    unique: true
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
	title:    {type: String},
  location: {type: String},
  long:     {type: String},
  lat:      {type: String},
  date:     {type: String},
  desc:     {type: String}
});

/*
personality: [
  big_five: [],
  needs: [],
  values: [],
  consumption_preferences: []
],
sentiment: [
  targeted_sentiment: {},
  document_sentiment: {
    sentiment_type: type: String,
    score: type: Integer
  }
]

*/
module.exports = mongoose.model('Listing', listingSchema);
