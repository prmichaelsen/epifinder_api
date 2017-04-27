
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
	, db_config = require('./db')
	, mongoose = require('mongoose')
	, bodyParser = require('body-parser')
	, path = require('path')
	;

mongoose.connect(db_config());

var app = express();


// Configuration

app.set('views', path.join(__dirname,  'views'));
app.set('view engine', 'jade');



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use('epifinder',express.static(path.join(__dirname , '/public')));

//configuring passport
var passport = require('passport');
var session = require('express-session');
app.use(session({secret: 'secret'}));
app.use(passport.initialize());
app.use(passport.session());

//use flash connect-flash
var flash = require('connect-flash');
app.use(flash());


//Initialize Passport
var initPassport = require('./passport/init');
initPassport(passport);


// Routes
var routes = require('./routes/index')(passport);
app.use('/epifinder/', routes);


app.listen(4548, function(){
  console.log("Express server listening on port "+ 4548);
});
