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
var System = require('./utils');

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
	System.out.println(now.toLocaleString() + ':', System.FG['bright-magenta']);
	System.out.println('\tremote address: "' + req.connection.remoteAddress + '"',
		System.FG['bright-cyan']);
	System.out.println('\t   request for: "' + req.url + '"',
		System.FG['bright-cyan']);
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

// For getting/setting user info
app.post('/user', function(req, res) {
	
	// Get the user ID
	var id = session.getSession(req, res);
	if (id == '') {
		
		// Generate a new user ID
		System.out.println('Creating new user...', System.FG['bright-yellow']);
		id = session.genID();
		session.setSession(req, res, id);
		System.out.println('Done.', System.FG['bright-yellow']);
		
		// Handle the actual command
		handleUserCmd(req, res, id);
	}
	
	// Check the database
	else {
		session.userExists(id, function(exists) {
			
			// Generate a new user ID if the user doesn't exist
			if (!exists) {
				System.out.println('Creating new user...', System.FG['bright-yellow']);
				id = session.genID();
				session.setSession(req, res, id);
				System.out.println('Done.', System.FG['bright-yellow']);
			}
			
			// Handle the actual command
			handleUserCmd(req, res, id);
		});
	}
});

/**
 * Handles a user command.
 */
function handleUserCmd(req, res, id) {
	
	var cmd = req.body.cmd;
	
	// Get user info
	if (cmd == 'GETINFO') {
		session.getInfo(id, function(info) {
			res.send(info);
		});
	}
	
	// Remove a course
	else if (cmd == 'REMCOURSE') {
		
		// TODO
		var course = req.body.course;
		res.status(418).send('Not implemented yet');
	}
	
	// 400 Bad Request: Not sure what to do
	else {
		res.status(400).send('undefined');
	}
}

// >>>>>>>>>>>>>>>>>>>>>>>> ERROR PAGES

// 404 Error handling
app.use(function(req, res) {
	res.status(404);
	res.render('error-404', {'title': 'Page not found! | UOIT Course Scheduler'});
});

/* ----------------------------- END ROUTES ----------------------------- */

// Start listening
app.listen(PORT, function() {
	System.out.println('Node server listening on port: ' + PORT, System.FG['bright-magenta']);
});
