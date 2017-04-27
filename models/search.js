var mongoose = require('mongoose');

module.exports = mongoose.model('Search',{ 
	search: String,
	count: Number
});
