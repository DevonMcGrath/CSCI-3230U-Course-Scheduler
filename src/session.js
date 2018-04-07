/* Name: session.js
 * Author: Devon McGrath
 * Description: This JS server file manages user's sessions with cookies.
 */

// Modules
var http = require('http');
var mongoose = require('mongoose');
var Cookies = require('cookies');
var uuid = require('uuid/v1');
var webParser = require('./web-parser');
var System = require('./utils');

// Constants
const SESSION_COOKIE = 'uoit-course-sch-session';
const DB = 'mongodb://localhost:27017/uoit-course-scheduler';
const MAX_SECTION_AGE_MS = 1 * 24 * 60 * 60 * 1000; // i.e. 1 day

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
		sid: {type: String, index: true}, term: String, sections: [
			{crn: Number, selected: Boolean}
		], courses: [{subject: String, code: String, term: String}], lastAccessed: Date
}, {collection: 'users'}));
var Section = mongoose.model('sections', new Schema({
	crn: {type: Number, index: true}, title: String, remaining: Number, schType: String, campus: String,
	lastUpdated: Date, subject: String, code: String, term: {type: String, index: true},
	instructor: String, instructionMethod: String, linkedSections: [{crn: Number}],
	times: [{start: Number, end: Number, day: String, location: String,
			startDate: Date, endDate: Date, scheduleType: String, instructor: String}]
}, {collection: 'sections'}));

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
function genID(afterInsertCallback) {
	var id = uuid();
	
	// Add the new user to the database
	var newUser = new User({sid: id, term: 'Not selected', courses: [],
		lastAccessed: new Date()});
	newUser.save(function(err) {
		
		// Insert failed
		if (err) {
			System.err.println('DB ERROR: failed to insert user: ' + err);
		}
		
		// Call the callback function
		if (afterInsertCallback) {
			afterInsertCallback(id, err);
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
		callback(found? results[0] : false);
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
			var usr = results[0];
			info = usr.term;
			var courses = usr.courses, n = courses.length? courses.length : 0;
			for (var i = 0; i < n; i ++) {
				var c = courses[i];
				info = info + '\n' + c.term + '\t' + c.subject + '\t' + c.code;
			}
		}
		
		// Call the callback with the info
		callback(info);
	});
}

/**
 * Adds a course to the specified user selection.
 *
 *	req		the HTTP request.
 *	res		the HTTP response.
 *	term	the term (e.g. 201801).
 *	subject	the course subject (e.g. CSCI).
 *	code	the course code (e.g. 1061U).
 *	id		the user ID to update.
 */
function addCourse(req, res, term, subject, code, id) {
	
	// Check if the user exists
	userExists(id, function(usr) {
		
		// User does not exist
		if (!usr) {
			System.err.println('\t              > cannot find user');
			res.status(500).send('');
			return false;
		}
		
		// Check if they already have the course added
		var found = false, n = usr.courses.length;
		for (var i = 0; i < n; i ++) {
			var c = usr.courses[i];
			if (c.term == term && c.subject == subject && c.code == code) {
				found = true;
				break;
			}
		}
		if (found) {
			System.out.println('\t              > user already added ' + subject + ' ' + code,
				System.FG['bright-yellow']);
			res.send('1'); // no update
			return true;
		}
		
		// Check database for course
		Section.find({term: term, subject: subject, code: code}).then(function(results) {
			
			// Sections do not exist
			if (results.length == 0) {
				findSections(req, res, term, subject, code, usr);
			}
			
			// Add the course to the user
			else {
				
				System.out.println('\t              > adding ' + subject + ' ' + code + ' from cache',
					System.FG['bright-green']);
				
				// Update the user and send the result
				var course = {term: term, subject: subject, code: code};
				User.update({sid: id}, {$push: {courses: course}},
					{multi: false}, function() {});
				res.send(term + '\t' + subject + '\t' + code);
			}
		});
	});
}

/**
 * Finds the course specified and adds it to the database. Adds the course to
 * the user's courses if it successfully finds the course.
 *
 *	req		the HTTP request.
 *	res		the HTTP response.
 *	term	the term (e.g. 201801).
 *	subject	the course subject (e.g. CSCI).
 *	code	the course code (e.g. 1061U).
 *	usr		the user object to update.
 */
function findSections(req, res, term, subject, code, usr) {
	
	// Make a request to the web parser
	webParser.getSections(term, subject, code, function(sections) {
		
		// No sections found
		if (!sections || sections.length == 0) {
			System.err.println('\t              > cannot find ' + subject + ' ' +
				code + ' for term ' + term);
			res.send('2'); // bad search
			return false;
		}
		
		// Check for a result that matches the search (i.e. just one course)
		var found = false, n = sections.length;
		for (var i = 0; i < n; i ++) {
			var s = sections[i];
			if (s.term == term && s.subject == subject && s.code == code) {
				found = true;
				break;
			}
		}
		
		// Send the proper result
		if (found) {
			var course = {term: term, subject: subject, code: code};
			User.update({sid: usr.id}, {$push: {courses: course}},
				{multi: false}, function() {});
			res.send(term + '\t' + subject + '\t' + code);
		} else {
			res.send('3'); // more than one match, please narrow search
		}
		
		// Add the sections to the database
		System.out.println('DB: inserting sections...', System.FG['bright-yellow']);
		Section.collection.insert(sections, function(err) {
			if (err) {
				System.err.println('DB ERROR: failed to insert new sections');
			} else {
				System.out.println('DB: ' + sections.length + ' sections inserted.',
					System.FG['bright-yellow']);
			}
		});
	});
}

/**
 * Sends the sections as JSON to the client.
 *
 *	req			the HTTP request.
 *	res			the HTTP response.
 *	sections	the sections to send.
 */
function sendSections(req, res, sections) {
	
	// Just send the sections as JSON to make parsing on the client easy
	if (!sections) {sections = [];}
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(sections));
}

/**
 * Removes a course from the specified user selection.
 *
 *	req		the HTTP request.
 *	res		the HTTP response.
 *	term	the term (e.g. 201801).
 *	subject	the course subject (e.g. CSCI).
 *	code	the course code (e.g. 1061U).
 *	id		the user ID to update.
 */
function removeCourse(req, res, term, subject, code, id) {
	
	// Check if the user exists
	userExists(id, function(usr) {
		
		// User does not exist
		if (!usr) {
			System.err.println('\t              > cannot find user');
			res.status(500).send('0');
			return;
		}
		
		// Check if they have the course
		var found = false, n = usr.courses.length, newCourses = [];
		for (var i = 0; i < n; i ++) {
			var c = usr.courses[i];
			if (c.term == term && c.subject == subject && c.code == code) {
				found = true;
			} else {
				newCourses.push(c);
			}
		}
		if (!found) {
			System.err.println('\t              > user does not have ' + subject + ' ' + code);
			res.send('0'); // no update
			return;
		}
		
		// Update the user
		User.update({sid: id}, {courses: newCourses}, {multi: false},
		function(err, numAffected) {
			
			// Error updating
			if (err || numAffected.nModified != 1) {
				System.err.println('\t              > DB COURSE UPDATE FAILED');
				res.send('0');
			} else {
				System.out.println('\t              > removed ' + subject +
					' ' + code + ' from a user', System.FG['bright-green']);
				res.send('1');
			}
		});
	});
}

/**
 * Sets the term for the user to use.
 *
 *	req		the HTTP request.
 *	res		the HTTP response.
 *	term	the term (e.g. 201801).
 *	id		the user ID to update.
 */
function setTerm(req, res, term, id) {
	
	// Check if the user exists
	System.out.println('\t              > updating user\'s term to "' + term + '"',
		System.FG['bright-green']);
	userExists(id, function(usr) {
		
		// User does not exist
		if (!usr) {
			System.err.println('\t              > cannot find user');
			res.status(500).send('0');
			return;
		}
		
		// Get the terms
		webParser.getTerms(function(terms) {
			
			// Check if the term exists
			var index = terms? terms.indexOf(term) : -1;
			
			// Does not exist
			if (index < 0) {
				System.err.println('\t              > could not find term "' + term + '"');
				res.status(400).send('0');
			}
			
			// Term does exist
			else {
				
				// No need to update database
				if (term == usr.term) {
					System.out.println('\t              > no change in user\'s term',
						System.FG['bright-green']);
					res.send('1');
					return;
				}
				
				// Update the term in the database
				User.update({sid: id}, {term: term}, {multi: false},
				function(err, numAffected) {
					
					// Error updating
					if (err || numAffected.nModified != 1) {
						System.err.println('\t              > DB TERM UPDATE FAILED');
						res.send('0');
					} else {
						System.out.println('\t              > DB UPDATED TERM',
							System.FG['bright-green']);
						res.send('1');
					}
				});
			}
		});
	});
}

/**
 * Gets the section info matching the specified search.
 *
 *	req		the HTTP request.
 *	res		the HTTP response.
 *	term	the term (e.g. 201801).
 *	subject	the course subject (e.g. CSCI).
 *	code	the course code (e.g. 1061U).
 */
function getSections(req, res, term, subject, code) {
	
	// Remove sections that are past the cache age
	var oldest = new Date((new Date()).valueOf() - MAX_SECTION_AGE_MS);
	Section.remove({lastUpdated: {$lt: oldest}}, function(err) {
		
		// Handle the deletion result
		if (err) {
			System.err.println('DB ERROR: could not delete old sections');
		}
		
		// Check if there are already sections matching the criteria
		Section.find({term: term, subject: subject, code: code}).then(function(results) {
			
			// Results found
			if (results.length > 0) {
				sendSections(req, res, results);
				System.out.println('\t              > sending cached sections for ' +
					subject + ' ' + code + ', for ' + term, System.FG['bright-green']);
			}
			
			// No sections found, try searching
			else {
				System.out.println('\t              > searching for ' +
					subject + ' ' + code + ', for ' + term, System.FG['bright-green']);
				getNewSections(req, res, term, subject, code);
			}
		});
	});
	
}

/**
 * Gets the section info matching the specified search, which were not
 * contained in the database.
 *
 *	req		the HTTP request.
 *	res		the HTTP response.
 *	term	the term (e.g. 201801).
 *	subject	the course subject (e.g. CSCI).
 *	code	the course code (e.g. 1061U).
 */
function getNewSections(req, res, term, subject, code) {
	
	// Make a request to the web parser
	webParser.getSections(term, subject, code, function(sections) {
		
		// No sections found
		if (!sections || sections.length == 0) {
			System.err.println('\t              > cannot find ' + subject + ' ' +
				code + ' for term ' + term);
			sendSections(req, res, []);
			return false;
		}
		
		// Send the sections back to the user
		sendSections(req, res, sections);
		var n = sections.length;
		System.out.println('\t              > found ' + n + ' sections for ' +
			subject + ' ' + code + ', for ' + term, System.FG['bright-green']);
		
		// Add the sections to the database
		System.out.println('DB: inserting sections...',
			System.FG['bright-yellow']);
		var errCount = 0;
		for (var i = 0; i < n - 1; i ++) {
			var s = sections[i];
			Section.update({crn: s.crn}, s, {upsert: true}, function(err) {
				if (err) {
					System.err.println('DB ERROR: could not insert section, ' + err);
					errCount ++;
				}
			});
		}
		Section.update({crn: sections[n-1].crn}, sections[n-1], {upsert: true}, function(err) {
			if (err) {
				System.err.println('DB ERROR: could not insert section, ' + err);
				errCount ++;
			}
			
			// If error, delete any that got inserted
			if (errCount > 0) {
				for (var i = 0; i < n; i ++) {
					Section.remove(sections[i], function(err) {});
				}
			}
		});
		System.out.println('DB: done inserting new sections',
			System.FG['bright-yellow']);
	});
}

// Export the necessary functions
module.exports.setSession = setSession;
module.exports.getSession = getSession;
module.exports.genID = genID;
module.exports.userExists = userExists;
module.exports.getInfo = getInfo;
module.exports.addCourse = addCourse;
module.exports.removeCourse = removeCourse;
module.exports.setTerm = setTerm;
module.exports.getSections = getSections;
