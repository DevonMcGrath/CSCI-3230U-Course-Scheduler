/* Name: core.js
 * Author: Devon McGrath and Martin Tuzim
 * Description: This script contains functions commonly used in the web application.
 */

var USER_URI = '/user', user = null, pageStatus = 0;

function User(data, term, courses) {
	this.data = data;
	this.term = term;
	this.courses = courses;
	
	/** Updates the HTML to tell the user the current term and courses they
	 *  selected. */
	this.updateInfo = function() {
		
		// Create the HTML to display to the user
		var t = this.term;
		var html = 'Courses: ';
		var c = this.courses? this.courses : [], n = c.length? c.length : 0;
		var added = 0;
		for (var i = 0; i < n; i ++) {
			if (c[i].term != t) {continue;}
			var course = c[i].subject + ' ' + c[i].code;
			html += '<span class="btn-simple" onclick="removeCourse(\'' + c[i].term +
				'\', \'' + c[i].subject + '\', \'' + c[i].code + '\');"' +
				' title="Remove course">' + course + '</span>';
			added++
		}
		if (added == 0) {
			html += 'None';
		}
		$('#user-info').css('display', 'block');
		$('#banner-courses').html(html);
		
		// Set the selected term
		$('#user-info select').val(t);
	}
}

/** Logs an error message. */
function log(msg) {
	console.error('UOIT COURSE SCHEDULER: ' + msg);
}
 
/** Generates an HTTP request to get extra content. */
function getData(path, responseFunction) {
	var xhttp = window.XMLHttpRequest? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && (this.status == 200 || this.status == 0)) {
			responseFunction(this.responseText);
		}
	};
	xhttp.open("GET", path, true);
	xhttp.send();
}

/** Posts data to the specified path. */
function postData(url, data, callback) {
	
	// Make the POST request
	$.ajax({
		type: 'POST',
		url: url,
		data: data,
		success: function(data) {
			callback(data, false);
		}, error: function(xhr) {
			callback(xhr.responseText, true);
		}
	});
}

/** Removes a course that the user has selected. */
function removeCourse(term, subject, code, callback) {
	
	// Encode the fields
	var name = subject + ' ' + code;
	term = term? encodeURIComponent(term) : '';
	subject = subject? encodeURIComponent(subject) : '';
	code = code? encodeURIComponent(code) : '';
	
	// Tell the server to remove the course
	postData(USER_URI, 'cmd=REMCOURSE&term=' + term + '&subject=' + subject + '&code=' + code,
	function(data, err) {
		
		// There was some error
		if (err) {
			log('Could not remove course ' + name);
		}
		
		// The course was removed
		else if (data == '1') {
			var newCourses = [], n = user.courses? user.courses.length : 0;
			for (var i = 0; i < n; i ++) {
				var current = user.courses[i].subject + ' ' + user.courses[i].code;
				if (name != current) {
					newCourses.push(user.courses[i]);
				}
			}
			user.courses = newCourses;
			user.updateInfo();
		}
		
		// Call the callback
		if (callback) {
			callback(data, err);
		}
	});
}

/** Adds a course to the user's selection. */
function addCourse(term, subject, code, callback) {
	
	// Encode the fields
	term = term? encodeURIComponent(term) : '';
	subject = subject? encodeURIComponent(subject) : '';
	code = code? encodeURIComponent(code) : '';
	
	// Tell the server to add the course
	postData(USER_URI, 'cmd=ADDCOURSE&term=' + term + '&subject=' + subject + '&code=' + code,
	function(data, err) {
		
		// Add course
		if (!err && data && data.indexOf('\t') >= 0) {
			var info = data.split('\t');
			var course = {term: info[0], subject: info[1], code: info[2]};
			user.courses.push(course);
			user.updateInfo();
		}
		
		// Print an error
		else if (err) {
			log('could not add "' + name + '" for term "' + term +
				'". Server responded with "' + data + '"');
		}
		
		// Call the callback
		if (callback) {
			callback(data, err);
		}
	});
}

/** Gets section information. */
function getSections(term, subject, code, callback) {
	
	// Encode the fields
	term = term? encodeURIComponent(term) : '';
	subject = subject? encodeURIComponent(subject) : '';
	code = code? encodeURIComponent(code) : '';
	
	// Get the sections
	postData(USER_URI, 'cmd=GETSECTIONS&term=' + term +
		'&subject=' + subject + '&code=' + code, callback);
}

/** Sets the term the user is viewing. */
function setTerm(term, callback) {
	
	// Encode the term
	term = term? encodeURIComponent(term) : '';
	
	// Tell the server to update the term
	postData(USER_URI, 'cmd=SETTERM&term=' + term,
	function(data, err) {
		
		// Update term
		if (!err && data == '1') {
			user.term = term;
			user.updateInfo();
		}
		
		// Print an error
		else if (err) {
			log('could not set term to "' + term + '"');
		}
		
		// Call the callback
		if (callback) {
			callback(data, err);
		}
	});
}

/** Set up the page. */
$(document).ready(function() {
	
	// Get the user info
	postData(USER_URI, 'cmd=GETINFO', function(data, err) {
		
		// Some error occurred
		if (err) {
			user = new User('Unavailable');
			user.updateInfo();
			pageStatus = 2;
			return;
		}
		
		// Create the user
		if (!data.courses) {data.courses = []};
		user = new User(data, data.term, data.courses);
		user.updateInfo();
		
		/* ------------------------ COURSE ADDITION TEST CODE ---- */
		addCourse('201801', 'CSCI', '1061U');//FIXME remove
		addCourse('201801', 'CSCI', '2050U');//FIXME remove
		/////////////////////////////////////////////////////////////
		
		// Set the page status to 2 after the user data has loaded
		pageStatus = 2;
	});
	
	// Add a listener to update the term
	$('#user-info select').change(function() {
		setTerm($('#user-info select').val());
	});
	
	pageStatus = 1;
});
