// grab the mongoose module
var mongoose = require('mongoose');
var Schema 	 = mongoose.Schema;

// define our nerd model
// module.exports allows us to pass this to other files when it is called
var ListingSchema = new Schema({
  pid: {
    type: String,
    unique: true
  },
  url: {
    type: String,
    required: true,
    unique: true
  },
	title: {type: String},
  location: {type: String},
  long: {type: String},
  lat: {type: String},
  date: {type: Date},
  desc: {type: String}
});

module.exports = mongoose.model('Listing', ListingSchema);
