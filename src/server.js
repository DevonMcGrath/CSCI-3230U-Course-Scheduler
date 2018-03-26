/* Name: server.js
 * Author: Devon McGrath
 * Description: This is the main JS file for the node server. It starts the
 * back-end server for the CSCI 3230U final project.
 */

// Modules
var express = require('express');
var bodyParser = require('body-parser');
var webParser = require('./web-parser');
var session = require('./session');

// Constants
const PORT = process.env.PORT || 8080;

// Middleware
var app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// Configure view engine
app.set('views', __dirname + '/views');
app.set('view engine', 'pug');

/* ----------------------------- BEGIN ROUTES ----------------------------- */
app.use(function(req, res, next) {
	var now = new Date();
	console.log(now.toLocaleString() + ': request for "' + req.url + '"');
	next();
});

// >>>>>>>>>>>>>>>>>>>>>>>> PAGES

// Home page
app.get('/', function(req, res) {
	res.render('index', {'title': 'UOIT Course Scheduler'});
});

// Select Courses page
app.get('/select-courses', function(req, res) {
	res.render('select-courses', {'title': 'Select Courses'});
});

// Schedule Options page
app.get('/schedule-options', function(req, res) {
	res.render('schedule-options', {'title': 'Schedule Options'});
});

// Schedule Creator page
app.get('/schedule-creator', function(req, res) {
	res.render('schedule-creator', {'title': 'Schedule Creator'});
});

// Program Browser page
app.get('/programs', function(req, res) {
	res.render('programs', {'title': 'Program Browser'});
});

// >>>>>>>>>>>>>>>>>>>>>>>> AJAX REQUESTS

// For getting the terms available
app.get('/get-terms', function(req, res) {
	webParser.getTerms(req, res);
});

// For getting available programs (e.g. Computer Science)
app.get('/get-programs', function(req, res) {
	webParser.getPrograms(req, res);
});

// >>>>>>>>>>>>>>>>>>>>>>>> ERROR PAGES

// 404 Error handling
app.use(function(req, res) {
	res.status(404);
	res.render('error-404', {'title': 'Page not found! | UOIT Course Scheduler'});
});

/* ----------------------------- END ROUTES ----------------------------- */

// Start listening
app.listen(PORT, function() {
	console.log('Node server listening on port: ' + PORT);
});
