module.exports = function(){
	var MONGO_USER = process.env.EPIFINDER_MONGO_USER;
	var MONGO_PASSWORD = process.env.EPIFINDER_MONGO_PASSWORD;
	var MONGO_HOST = process.env.EPIFINDER_MONGO_HOST;
	var mongodbUri = 'mongodb://'+MONGO_USER+':'+MONGO_PASSWORD+'@'+MONGO_HOST;
	return mongodbUri; 
}
