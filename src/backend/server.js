/* Name: server.js
 * Author: Devon McGrath
 * Description: This JS file is the main server-side code for the web app.
 * It is responsible for receiving client HTTP requests and responding with
 * the appropriate data (HTML/CSS/JavaScript/JSON/image etc.).
 */

// Required modules
var http = require('http');
var fs = require('fs');
var url = require('url');
var parser = require('./web-parser');

// Constants
const PORT = 8080; // the port the server is listening on
const FAVICON = '../frontend/favicon.ico'; // path to the favicon
const ERROR_404_FILE = "../frontend/error404.html"; // path to the 404 error page
const URI_MAPPINGS = [ // the mapping from a URI to file for the server to send
	// Main pages
	{"uri": "/", "file": "../frontend/index.html", "type": "text/html"},
	{"uri": "/select-courses", "file": "../frontend/select-courses.html", "type": "text/html"},
	{"uri": "/schedule-options", "file": "../frontend/schedule-options.html", "type": "text/html"},
	{"uri": "/schedule-creator", "file": "../frontend/schedule-creator.html", "type": "text/html"},
	{"uri": "/programs", "file": "../frontend/programs.html", "type": "text/html"},
	
	// CSS files
	{"uri": "/styles.css", "file": "../frontend/styles.css", "type": "text/css"},
	{"uri": "/styles/programs.css", "file": "../frontend/styles/programs.css", "type": "text/css"},
	
	// JS files
	{"uri": "/scripts/core.js", "file": "../frontend/scripts/core.js", "type": "text/javascript"},
	{"uri": "/scripts/programs.js", "file": "../frontend/scripts/programs.js", "type": "text/javascript"},
	
	// AJAX requests
	{"uri": "/get-terms", "type": "text/html", "getter": parser.getTerms},
	{"uri": "/get-programs", "type": "text/plain", "getter": parser.getPrograms}
];

console.log('Starting server on port:', PORT);

// Create the server to listen on the port
http.createServer(function (request, response) {
	setTimeout(respondToRequest, 0, request, response);
}).listen(PORT);

/**
 * Sends the user a HTTP response with the appropriate data. If the requested
 * URI in the HTTP request is not mapped to any file for the server to send,
 * the response will be the error 404 page. The only exception to this is when
 * the URI has a 'getter' function, which will instead be used to send the
 * page response.
 *
 * req	the HTTP request sent by a client.
 * res	the HTTP response object to send the data back to the user.
 */
function respondToRequest(req, res) {
	
	// Get the URI from the URL
	var reqUrl = url.parse(req.url);
	var uri = reqUrl.pathname;

	// Log the requested resource URI
	console.log("Request for '" + uri + "' received.");
	
	// If requesting favicon, serve it
	if (uri == '/favicon.ico') {
		
		fs.readFile(FAVICON, function(error, data) {
			if (!error) { // Send the file data
				res.writeHead(200, {});
				res.write(data);
				res.end();
			} else { // Missing file
				res.writeHead(404, {});
				res.end();
			}
		});
		return;
	}
	
	// Figure out if the URI has a mapping
	var filePath = '', type = 'text/html', getter;
	for (var i = 0; i < URI_MAPPINGS.length; i ++) {
		var map = URI_MAPPINGS[i];
		if (map.uri == uri) {
			if (map.file) {
				filePath = map.file;
			} else {
				getter = map.getter;
			}
			type = map.type;
			break;
		}
	}
	if (filePath.length == 0 && !getter) { // no mapping, send 404 page
		filePath = ERROR_404_FILE;
	}
	
	// Check if a getter exists
	if (getter) {
		getter(req, res);
		return;
	}
	
	// Serve the file to the user
	fs.readFile(filePath, function(error, data) {
		if (!error) { // Send the file data
			res.writeHead(200, {'Content-Type': type});
			res.write(data);
			res.end();
		} else { // Missing file
			var err404 = '<!DOCTYPE html><html lang="en-ca"><head><title>Error 404</title></head>';
			err404 += '<body><p>Error 404: Page not found!</p><p>Go back to the app <a ';
			err404 += 'href="'+URI_MAPPINGS[0].uri+'">here</a>.</p></body></html>';
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.write(err404);
			res.end();
		}
	});
}
