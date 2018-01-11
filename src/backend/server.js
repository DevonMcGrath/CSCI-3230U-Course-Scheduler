// Required modules
var http = require('http');
var fs = require('fs');
var url = require('url');

// Constants
var PORT = 8080;	// the port the server is listening on
var ERROR_404_FILE = "../frontend/error404.html";
var URI_MAPPINGS = [
	{"uri": "/", "file": "../frontend/index.html", "type": "text/html"},
	{"uri": "/select-courses", "file": "../frontend/select-courses.html", "type": "text/html"},
	{"uri": "/schedule-options", "file": "../frontend/schedule-options.html", "type": "text/html"},
	{"uri": "/schedule-creator", "file": "../frontend/schedule-creator.html", "type": "text/html"},
	{"uri": "/programs", "file": "../frontend/programs.html", "type": "text/html"},
	{"uri": "/styles.css", "file": "../frontend/styles.css", "type": "text/css"}
];

console.log('Starting server on port:', PORT);

// Create the server to listen on the port
http.createServer(function (request, response) {
	setTimeout(respondToRequest, 0, request, response);
}).listen(PORT);

function respondToRequest(req, res) {
	
	// Get the URI from the URL
	var uri = url.parse(req.url).pathname;

	// Print the name of the file for which request is made.
	console.log("Request for " + uri + " received.");
	
	// If requesting favicon, serve it
	if (uri == '/favicon.ico') {
		
		fs.readFile('../frontend/favicon.ico', function(error, data) {
			if (!error) { // Send the file data
				res.writeHead(200, {});
				res.end(data);
			} else { // Missing file
				res.writeHead(404, {});
				res.end();
			}
		});
		return;
	}
	
	// Figure out if the URI has a mapping
	var filePath = '', type = 'text/html';
	for (var i = 0; i < URI_MAPPINGS.length; i ++) {
		var map = URI_MAPPINGS[i];
		if (map.uri == uri) {
			filePath = map.file;
			type = map.type;
			break;
		}
	}
	if (filePath.length == 0) {
		filePath = ERROR_404_FILE;
	}
	
	// Serve the file to the user
	fs.readFile(filePath, function(error, data) {
		if (!error) { // Send the file data
			res.writeHead(200, {'Content-Type': type});
			res.end(data);
		} else { // Missing file
			var err404 = '<!DOCTYPE html><html lang="en-ca"><head><title>Error 404</title></head>';
			err404 += '<body><p>Error 404: Page not found!</p><p>Go back to the app <a ';
			err404 += 'href="'+URI_MAPPINGS[0].uri+'">here</a>.</p></body></html>';
			res.writeHead(404, {'Content-Type': 'text/html'});
			res.end(err404);
		}
	});
}