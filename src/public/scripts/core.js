/* Name: core.js
 * Author: Devon McGrath and Martin Tuzim
 * Description: This script contains functions commonly used in the web application.
 */

var USER_URI = '/user', user = null;

function User(term, courses) {
	this.term = term;
	this.courses = courses;
	
	/** Updates the HTML to tell the user the current term and courses they
	 *  selected. */
	this.updateInfo = function() {
		
		// Create the HTML to display to the user
		var html = 'Term: <span class="term">' + this.term + '</span> | Courses: ';
		var c = this.courses? this.courses : [], n = c.length? c.length : 0;
		for (var i = 0; i < n; i ++) {
			html += '<span class="btn-simple" onclick="removeCourse(\'' + c[i] + '\');"' +
				' title="Remove course">' + c[i] + '</span>';
		}
		if (n == 0) {
			html += 'None';
		}
		$('#user-info').css('display', 'block').html(html);
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
function removeCourse(name) {
	
	// Tell the server to remove the course
	name = name? encodeURIComponent(name) : '';
	postData(USER_URI, 'cmd=REMCOURSE&course=' + name, function(data, err) {
		
		// There was some error
		if (err) {
			log('Could not remove course ' + data);
		}
		
		// The course was removed
		else {
			
		}
	});
}

/** Set up the page. */
$(document).ready(function() {
	
	// Get the user info
	postData(USER_URI, 'cmd=GETINFO', function(data, err) {
		if (err) {
			user = new User('Unavailable');
			user.updateInfo();
			return;
		}
		
		// Create the user
		var res = data.split('\t'), n = res.length;
		var html = 'Term: <span class="term">' + res[0] + '</span> | Courses: ';
		var courses = [];
		for (var i = 1; i < n; i ++) {
			courses.push(res[i]);
		}
		
		user = new User(res[0], courses);
		user.updateInfo();
	});
});
