const mongoose = require('mongoose');
// grab the mongoose module
const Schema 	 = mongoose.Schema;

// define our nerd model
// module.exports allows us to pass this to other files when it is called
const listingSchema = new Schema({
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

listingSchema.pre('save', next => {
  let self = this;
  Listing.find({pid: self.pid}, (err, docs) => {
    if (!docs.length) {
      next();
    } else {
      console.log('Entry already exists: ', self.pid);
      next(new Error('Entry Exists!'));
    }
  });
});

module.exports = mongoose.model('Listing', listingSchema);
