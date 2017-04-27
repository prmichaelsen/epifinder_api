var mongoose = require('mongoose');

module.exports = mongoose.model('User',{

		username: String,
		full_name: String,
		phone_number: String,
		password: String,
		email: String,
		department: String,
		designation: String,
		healthcare_license: String,

		resetPasswordToken: String,
		resetPasswordExpires: Date

});
