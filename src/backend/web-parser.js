/* Name: web-parser.js
 * Author: Devon McGrath
 * Description: This JS file does all the web parsing and returns the
 * parsed data.
 */

// Required modules
var http = require('http');

// Main pages
var TERM_PAGE = {
	"domain": "ssbp.mycampus.ca",
	"uri": "/prod_uoit/bwckschd.p_disp_dyn_sched?TRM=U",
	"getData": function (termId) {
		return 'p_calling_proc=bwckschd.p_disp_dyn_sched&TRM=U&p_term=' + termId;
	},
	"postUri": "/prod_uoit/bwckgens.p_proc_term_date"
};

/**
 * Gets web page data by submitting a HTTP request to the specified domain/URI.
 * Once a response is received, it is sent to the callback function.
 *
 * domain	the domain to send the request to (e.g. www.google.ca)
 * uri		the path to a resource (e.g. /home)
 * callback	the function called with the response data
 * method	the type of request (e.g. GET)
 * data		the data to send in the request
 */
function getWebPageData(domain, uri, callback, method, data) {
	
	// Fix the method if necessary
	if (!method) {
		method = 'GET';
	}
	method = method.toUpperCase();
	
	// HTTP request options
	var opts = {
		"host": domain,
		"path": uri,
		"method": method,
		"port": "80",
		"headers": {}
	};
	if (data) { // If posting data
		opts.headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(data)
		};
	}
	
	// Generate request
	var req = http.request(opts, function(res) {
		var out = '';
		res.on('data', function(chunk) {
			out += chunk;
		});
		res.on('end', function() {
			callback(out);
		});
	});
	req.on('error', function(err) {
		var msg = 'Error: ' + err.message;
		console.log(msg);
		callback(msg);
	});
	
	// Send it
	if (data) {
		req.write(data);
	}
	req.end();
}

/**
 * Gets the available terms to create a schedule for, as HTML and sends
 * it back through the HTTP response.
 *
 * req	the initial client request.
 * res	the HTTP response object.
 */
function getTerms(req, res) {

	// Make the request
	getWebPageData(TERM_PAGE.domain, TERM_PAGE.uri, function(html) {
		
		try {
			
			// Get only the form
			var parts = html.split(/<form /i);
			if (parts.length > 1) {
				html = "<form " + parts[1];
			}
			parts = html.split(/<\/form>/i);
			html = parts[0] + "</form>";
			html = html.replace(/ \(view schedule only\)/gi, '');
		} catch (e) {console.log(e);}
		
		// Send the response HTML
		res.writeHead(200, {});
		res.write(html);
		res.end();
	}, 'GET');
}

// Export the necessary functions
module.exports.getTerms = getTerms;
