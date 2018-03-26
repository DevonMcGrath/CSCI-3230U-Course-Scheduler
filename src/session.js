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

/**
 * Saves session info in the session cookie.
 *	req		the HTTP request
 *	res		the HTTP response
 *	data	the data to put in the cookie
 */
function setSession(req, res, data) {
	var cookies = new Cookies(req, res);
	cookies.set(SESSION_COOKIE, data);
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end('1');
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
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.end(session);
	return session;
}

// Export the necessary functions
module.exports.setSession = setSession;
module.exports.getSession = getSession;
