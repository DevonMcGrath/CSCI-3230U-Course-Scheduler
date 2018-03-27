/* Name: session.js
 * Author: Devon McGrath
 * Description: This JS server file manages user's sessions with cookies.
 */

// Modules
var http = require('http');
var mongoose = require('mongoose');
var Cookies = require('cookies');
var uuid = require('uuid/v1');

// Constants
const SESSION_COOKIE = 'uoit-course-sch-session';
const DB = 'mongodb://localhost:27017/uoit-course-scheduler';

// Database configuration
console.log('Connecting to database...');
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
mongoose.connect(DB, function(err) {
	if (err) {
		console.error('Failed to connect to database.');
		console.log('Please start the database.');
		process.exit(1); // TERMINATE
	} else {
		console.log('Connected to database.');
	}
});

// Database tables
var User = mongoose.model('users', new Schema({
		sid: String, term: String, sections: [
			{crn: Number, selected: Boolean}
		]
	}, {collection: 'users'}));
var Section = mongoose.model('sections', new Schema({
	crn: Number, title: String, remaining: Number, type: String, campus: String,
	room: String, lastUpdated: Date, subject: String, code: String, term: String
	}, {collection: 'sections'}));

/**
 * Saves session info in the session cookie.
 *	req		the HTTP request
 *	res		the HTTP response
 *	data	the data to put in the cookie
 */
function setSession(req, res, data) {
	var cookies = new Cookies(req, res);
	cookies.set(SESSION_COOKIE, data);
}

/**
 * Gets the session info from the session cookie.
 *	req	the HTTP request
 *	res	the HTTP response
 */
function getSession(req, res) {
	var cookies = new Cookies(req, res);
	var session = cookies.get(SESSION_COOKIE);
	session = session? session : '';
	return session;
}

/**
 * Generates a new session ID, puts it in the database, and returns it.
 */
function genID() {
	var id = uuid();
	
	// Add the new user to the database
	var newUser = new User({sid: id, term: 'Not selected'});
	newUser.save(function(err) {
		
		// Insert failed
		if (err) {
			console.error('DB ERROR: failed to insert user: ' + err);
		}
	});
	
	return id;
}

/**
 * Checks if the specified user ID is in the database.
 *	id			the ID to check for
 *	callback	the callback function 
 */
function userExists(id, callback) {
	User.find({sid: id}).then(function(results) {callback(results.length > 0);});
}

// Export the necessary functions
module.exports.setSession = setSession;
module.exports.getSession = getSession;
module.exports.genID = genID;
module.exports.userExists = userExists;
