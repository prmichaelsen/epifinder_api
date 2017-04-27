var express = require('express');
var crypto = require('crypto');
var User = require('../models/user');
var Search = require('../models/search');
var db = require('../db.js');
var async = require('async');
var nodemailer = require('nodemailer');
var router = express.Router();

var isAuthenticated = function (req, res, next) {
	///	 if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

module.exports = function(passport){


	/* GET login page. */
	router.get('/', function(req, res) {
		// Display the Login page with any flash message, if any
		res.render('index', { message: req.flash('message') });
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect: '/epifinder/home',
		failureRedirect: '/epifinder/',
		failureFlash : true  
	}));

	/* Handle Login POST */
	router.post('/api/login', passport.authenticate('login', {
		successRedirect: '/epifinder/api/login/callback',
		failureRedirect: '/epifinder/api/login/callback',
		failureFlash : true  
	}));

	router.get('/api/login/callback', function(req, res){
	});
	/* Handle Login POST */
	//router.post('api/login', passport.authenticate('login', {session:false}),
				//function(err, user, info) {
					////console.log("here");
					//if (err) { return next(err) }
					//if (!user) { return res.json( { message: info.message }) }
					//res.json(user);}
	//,
	////(req, res)=>{	
		//console.log("user",req.user);
		//console.log("flash",req.flash);
		//console.log("body",req.body);
				//res.json({id:req.user.id,username:req.user.username});
	//});


	/* GET Registration Page */
	router.get('/signup', function(req, res){
		res.render('register',{message: req.flash('message')});
	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signup', {
		successRedirect: '/epifinder/home',
		failureRedirect: '/epifinder/signup',
		failureFlash : true  
	}));

	/* Handle Registration POST */
	router.post('/api/register', passport.authenticate('signup', {
		successRedirect: '/epifinder/api/login/callback',
		failureRedirect: '/epifinder/api/login/callback',
		failureFlash : true  
	}));


	/* Handle post search data */
	router.post('/api/data', function(req, res) { 
		var searchedTerm = req.param('search');
		Search.findOne({ 'search' :  searchedTerm }, function(err, search) {
			// In case of any error, return using the done method
			if (err){
				return;
			}
			// already exists
			if (search) {
				search.count += 1; 
				search.save(function(err) {
					if (err){
						console.log('Error in Saving user: '+err);  
						throw err;  
					}
					return res.json({"message":"search term save succesful. Saved term: "+searchedTerm + " and term exists " + search.count + " times"}); 
				});
			} else {
					var newSearchTerm = new Search(); 
					newSearchTerm.search = req.param('search'); 
					newSearchTerm.count = 1;
					// save the user
					newSearchTerm.save(function(err) {
						if (err){
							console.log('Error in Saving user: '+err);  
							throw err;  
						}
						else{
							return res.json({"message":"search term save succesful. Saved term: "+searchedTerm + " and term exists " + newSearchTerm.search.count + " times"}); 
						}
					});
				}
			});
	});

	/* Handle get search data */
	router.get('/api/data', function(req, res) { 
		Search.find({},function(err, results) { 
			return res.json({"data":results});
		});
	});

	/* GET Home Page */
	router.get('/home', isAuthenticated, function(req, res){
		console.log(req.body);
		res.render('home', { user: req.user });
	});

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/epifinder/');
	});

	/* Handle Logout */
	router.get('/api/logout', function(req, res) {
		req.logout();
		return res.json({message:['User has been logged out']});
	});


	//forgot passwword page
	router.get('/forgot', function(req,res){

		res.render('forgot',{
			user: req.user,
			message: req.flash('message')
		});
	});


	//reset password
	router.post('/forgot', (req,res,next)=>{
		async.waterfall([
			(done)=>{
				crypto.randomBytes(20, (err,buf)=>{
					var token = buf.toString('hex');
					done( err, token );
				});
			},
			(token,done)=>{
				User.findOne( { username: req.body.email}, (err,user)=>{
					if(!user){
						req.flash('message','No account with that email address exists');
						return res.redirect('/epifinder/forgot');
					}

					user.resetPasswordToken = token;
					user.resetPasswordExpires = Date.now() + 1*60*60*1000; //1 hour

					user.save((err)=>{
						done(err, token, user);
					});
				});
			},
			(token, user, done)=>{
				var smtpTransport = nodemailer.createTransport('SMTP', {
					service: 'SendGrid',
					auth: {
						user: process.env.EPIFINDER_SENDGRID_USER,
						pass: process.env.EPIFINDER_SENDGRID_PASSWORD
					}
				});
				

				var mailOptions = {
					to: user.email,
					from: 'passwordreset@epifinder.com',
					subject: 'Epifinder Password Reset',
					text: 
						'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
						'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
						'http://' + req.headers.host + '/epifinder/reset/' + token + '\n\n' +
						'If you did not request this, please ignore this email and your password will remain unchanged.\n'																      
				};

				smtpTransport.sendMail( mailOptions, (err)=>{
					req.flash('message','An e-mail has been sent to '+user.email+'with further instructions on resetting your password.');
					done(err,'done');
				});
				
			}
		], (err)=>{
			if(err) { return next(err); }	
			res.redirect('/epifinder/forgot');		
		});
	});


	router.get('/reset/:token', (req,res)=>{
		User.findOne( 
			{ 
				resetPasswordToken: req.params.token, 
				resetPasswordExpires: { $gt: Date.now() },
			}, (err,user)=> {

				if (!user) {

				}
				res.render('reset', {
					user: req.user
				});

					
			

		});
	});

	router.post('/reset/:token', (req,res)=>{
		async.waterall([
				(done)=>{
					User.findOne(
						{
							resetPasswordToken: req.params.token,
							resetPasswordExpires: { $get: Date.now() } 
						},
						(err, user)=> {

						});
						
				}

			], (err)=>{
				res.redirect('/');
			});


	});


	return router;
}



