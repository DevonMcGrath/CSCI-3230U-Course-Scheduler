/* Name: session.js
 * Author: Devon McGrath
 * Description: This JS server file manages user's sessions with cookies.
 */

// Modules
var http = require('http');
var mongoose = require('mongoose');
var Cookies = require('cookies');
var uuid = require('uuid/v1');
var System = require('./utils');

// Constants
const SESSION_COOKIE = 'uoit-course-sch-session';
const DB = 'mongodb://localhost:27017/uoit-course-scheduler';

// Database configuration
System.out.println('Connecting to database...', System.FG['bright-yellow']);
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
mongoose.connect(DB, function(err) {
	if (err) {
		System.err.println('Failed to connect to database.');
		System.out.println('Please start the database.');
		process.exit(1); // TERMINATE
	} else {
		System.out.println('Connected to database.', System.FG['bright-yellow']);
	}
});

// Database tables
var User = mongoose.model('users', new Schema({
		sid: String, term: String, sections: [
			{crn: Number, selected: Boolean}
		], courses: [{subject: String, code: String}], lastAccessed: Date
}, {collection: 'users'}));
var Section = mongoose.model('sections', new Schema({
	crn: Number, title: String, remaining: Number, type: String, campus: String,
	room: String, lastUpdated: Date, subject: String, code: String, term: String,
	instructor: String, instructionMethod: String, linkedSections: [{crn: Number}],
	times: [{start: Date, end: Date, day: String, location: String, date: Date,
	scheduleType: String, instructor: String}]
}, {collection: 'sections'}));
var Course = mongoose.model('courses', new Schema({
	subject: String, code: String, lastUpdated: Date
}, {collection: 'courses'}));

/**
 * Checks if something should be updated based on the date it was entered and
 * the current date.
 *	date1		the date to check against
 *	maxDeltaMs	the maximum number of milliseconds that the date is valid for
 */
function needsUpdate(date, maxDeltaMs) {
	return Math.abs(new Date() - date) > maxDeltaMs;
}

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
	var newUser = new User({sid: id, term: 'Not selected', courses: [],
		lastAccessed: new Date()});
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
	User.find({sid: id}).then(function(results) {
		var found = results.length > 0;
		
		// If something was found, update the last accessed time
		if (found) {
			User.update({sid: id}, {lastAccessed: new Date()},
				{multi: false}, function() {});
		}
		
		// Tell the callback if something was found
		callback(found);
	});
}

/**
 * Gets the info of a user in tab-separated format with term	<courses...>
 *	id			the id of the user
 *	callback	the callback function to receive the string of info
 */
function getInfo(id, callback) {
	User.find({sid: id}).then(function(results) {
		var found = results.length > 0;
		var info = '';
		
		// If something was found, create the info
		if (found) {
			info = results[0].term;
			var courses = results[0].courses, n = courses.length? courses.length : 0;
			for (var i = 0; i < n; i ++) {
				var c = courses[i];
				info = info + '\t' + c.subject + ' ' + c.code;
			}
		}
		
		// Call the callback with the info
		callback(info);
	});
}

// Export the necessary functions
module.exports.setSession = setSession;
module.exports.getSession = getSession;
module.exports.genID = genID;
module.exports.userExists = userExists;
module.exports.getInfo = getInfo;
