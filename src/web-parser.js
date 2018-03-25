/* Name: web-parser.js
 * Author: Devon McGrath
 * Description: This JS file does all the web parsing and returns the
 * parsed data.
 */

// Required modules
var http = require('http');
var url = require('url');
var querystring = require('querystring');

// Main pages
var TERM_PAGE = {
	"domain": "ssbp.mycampus.ca",
	"uri": "/prod_uoit/bwckschd.p_disp_dyn_sched?TRM=U",
	"getData": function (termId) {
		return 'p_calling_proc=bwckschd.p_disp_dyn_sched&TRM=U&p_term=' + termId;
	},
	"postUri": "/prod_uoit/bwckgens.p_proc_term_date",
	"terms": []
};
var CATALOG_PAGE = {
	"domain": "catalog.uoit.ca",
	"uri": "/"
}

// HTML data storage
var progLinks;

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
 * Gets the available terms to create a schedule for, as text and sends
 * it back through the HTTP response. The response text is tab-separated term
 * IDs (e.g. 201801\t201709\t201705...).
 *
 * req	the initial client request.
 * res	the HTTP response object.
 */
function getTerms(req, res) {
	
	// Check if the terms have already been requested before
	if (TERM_PAGE.terms.length) {
		console.log('> Sending cached terms.');
		
		// Create the text
		var v = TERM_PAGE.terms, n = v.length, txt = '';
		for (var i = 0; i < n; i ++) {
			txt += v[i] + '\t';
		}
		if (txt.length > 0) {
			txt = txt.substr(0, txt.length - 1);
		}
		
		// Send the response text
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.write(txt);
		res.end();
		
		return;
	}

	// Make the request
	getWebPageData(TERM_PAGE.domain, TERM_PAGE.uri, function(html) {
		
		var form = {}, txt = '';
		try {
			
			// Get only the form
			var parts = html.split(/<form /i);
			if (parts.length > 1) {
				html = "<form " + parts[1];
			}
			parts = html.split(/<\/form>/i);
			html = parts[0] + "</form>";
			form = getFormData(html)[0];
			
			// Get the terms
			if (form) {
				for (var i = 0; i < form.inputs.length; i ++) {
					if (form.inputs[i].values.length > 1) {
						var v = form.inputs[i].values, n = v.length;
						for (var j = 0; j < n; j ++) {
							if (v[j].length > 0) {
								txt += v[j] + '\t';
								TERM_PAGE.terms.push(v[j]);
							}
						}
						if (txt.length > 0) {
							txt = txt.substr(0, txt.length - 1);
						}
						break;
					}
				}
			}
		} catch (e) {console.log(e);}
		TERM_PAGE.form = form;
		
		// Send the response text
		res.writeHead(200, {'Content-Type': 'text/plain'});
		res.write(txt);
		res.end();
	}, 'GET');
}

/**
 * Gets the programs available to take and sends them back using the HTTP
 * request from the client. Each line sent to the client is a text string
 * with the program name.
 *
 * req	the initial client request.
 * res	the HTTP response object.
 */
function getPrograms(req, res) {
	
	// Get the URL
	var reqUrl = url.parse(req.url);
	
	// If it has ?[number] in the url, get the program [number] data
	if (reqUrl.search && progLinks) { 
		var number = parseInt(reqUrl.search.slice(1));
		if (number >= 0 && number < progLinks.length) {
			getWebPageData(CATALOG_PAGE.domain, '/'+progLinks[number].uri,
				function(html) {getCourses(html, res);}, 'GET');
			return;
		}
	}
	
	// If a list of programs was already requested earlier
	if (progLinks) {
		sendProgramList(res);
		return;
	}
	
	// If not, send the HTTP requests needed to get the data
	getWebPageData(CATALOG_PAGE.domain, CATALOG_PAGE.uri, function(html) {
		
		// No data
		if (html.length == 0) {
			sendProgramList(res);
			return;
		}
		
		// Get the link to the 'Programs (by Degree)' page
		html = html.split(/Programs \(by Degree\)/i)[0];
		var uri = '', domain = CATALOG_PAGE.domain, parts;
		parts = html.split(/<a href="/i);
		html = parts[parts.length - 1]; // get the last link
		html = html.split('"')[0]; // get only the link
		html = html.replace(/http(s*):\/\//, '');
		var start = html.indexOf('/');
		if (start < 1) {
			uri = html;
		} else {
			domain = html.slice(0, start);
			uri = html.slice(start);
		}
		
		// If no URI found, send nothing
		if (uri.length == 0) {
			sendProgramList(res);
			return;
		}
		
		// Send the get request to the page with the program list
		getWebPageData(domain, uri, function(data) {
			
			// No data
			if (data.length == 0) {
				sendProgramList(res);
				return;
			}
			
			// Get only the relevant HTML
			var parts;
			try {
				parts = data.split(/<strong>Bachelor of Applied Science \(Honours\)<\/strong><\/p>/i);
				data = parts[parts.length - 1];
				data = data.split(/<strong>Co-operative Education<\/strong>/i)[0];
			} catch (e) {console.log(e);}
			data = data.replace(/&#8211;/g, '-');
			parts = data.split(/<a href="/i);
			
			// Create the list of programs
			progLinks = [];
			var n = parts.length;
			for (var i = 1; i < n; i ++) {
				var p = {"program": "", "uri": ""}, d = parts[i];
				p.uri = d.split('"')[0];
				try {
					p.program = d.split('>')[1].split('<')[0];
					progLinks.push(p);
				} catch (e) {console.log(e);}
			}
			sendProgramList(res);
		}, 'GET');
	}, 'GET');
}

/** 
 * Sends the list of programs available to the client.
 *
 *	res	the HTTP response object to respond to the client.
 */
function sendProgramList(res) {
	
	// Generate the output
	var list = '', n = progLinks && progLinks.length? progLinks.length : 0;
	for (var i = 0; i < n; i ++) {
		list = list + progLinks[i].program + '\n';
	}
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.write(list);
	res.end();
}

/**
 * Parses the HTML from a program page and gets the list of courses needed to
 * be taken to complete the program. Then, the function sends the data as plain
 * text back to the client.
 *
 *	res	the HTTP response object to respond to the client.
 */
function getCourses(html, res) {
	if (!html) {html = '';}
	
	// Split by year
	var years = html.split(/<\/a>Year /i), out = '';
	for (var i = 1; i < years.length; i ++) {
		var d = years[i].replace(/&#160;/g, ' ').replace(/&#8211;/g, '-');
			
		// Get the year
		out = out + '<th>Year ' + d.split('<', 2)[0] + '</th>\n';
		
		// Get the text from the HTML
		var txt = ('<' + d.slice(d.indexOf('<'))).replace(/<[^>]+>/g, '\n');
		txt = txt.replace(/\n{2,}/g, '\n');

		// Trim the string to only necessary content
		var lines = txt.split('\n'), n = lines.length, lastAdd = 0;
		var exp = /(Elective|^or|^one of|^Semester|^[a-z]{3,4} [0-9]{4})/i;
		txt = '';
		for (var j = 0; j < n && (j - lastAdd) < 7; j ++) {
			if (exp.test(lines[j])) {
				txt += lines[j] + '\n';
				lastAdd = j;
			}
		}
		txt = txt.replace(/(^\n+|\n+$)/g, '');
		
		out += txt + '\n';
	}
	
	// Send the response to the client
	res.writeHead(200, {'Content-Type': 'text/plain'});
	res.write(out);
	res.end();
}

/**
 * Parses a raw HTML string to get form data. This includes the action, method,
 * inputs, and default values.
 *
 *	html	the raw HTML string to parse.
 * Returns an array of form objects, each with the properties: 'action' : string,
 * 'method' : string, 'inputs' : Array({'name' : string, 'values' : Array(string)}).
 */
function getFormData(html) {
	if (!html) {return [];}
	
	// Parse each form individually
	var forms = [];
	var s = html.split(/<form /i);
	for (var i = 1; i < s.length; i++) {
		var f = s[i].split(/<\/form>/i, 2)[0];
		var obj = {"action": "", "method": "GET", "inputs": []};
		var tmp = f.split('>', 2);
		
		// Get the basic form info
		obj.action = extractAttribute(tmp[0], 'action');
		var r = extractAttribute(tmp[0], 'method');
		if (r.length > 0) {
			obj.method = r.toUpperCase();
		}
		
		// Get the form elements
		f = f.replace(/(\n|\r\n)/g, '');
		var m = f.match(/(<input[^>]*>|<select(.+?)<\/select>|<textarea(.+?)<\/textarea>)/gi);
		var n = m? m.length : 0;
		for (var j = 0; j < n; j ++) {
			var inObj = {"name": extractAttribute(m[j], 'name'), "values": []};

			// Handle the different inputs
			if (!/^<select/i.test(m[j])) { // <input .../> and <textarea></textarea>
				inObj.values.push(extractAttribute(m[j], 'value'));
			} else { // <select>...</select>
				// Check for 'selected' option
				var opt = m[j].match(/<option[^>]+selected[^>]*>/i);
				if (opt) {
					inObj.values.push(extractAttribute(opt[0], 'value'));
					m[j] = m[j].replace(opt[0], '');
				}
				opt = m[j].match(/<option[^>]+>/gi);
				if (opt) {
					for (var k = 0; k < opt.length; k ++) {
						inObj.values.push(extractAttribute(opt[k], 'value'));
					}
				}
			}
			obj.inputs.push(inObj);
		}
		
		forms.push(obj);
	}
	
	return forms;
}

/**
 * Gets the specified attribute value. E.g. if the HTML is <input name="a" />,
 * the attr(ibute) is name, 'a' would be returned.
 *
 *	html	the HTML with attributes.
 *	attr	the attribute to get.
 * Returns the value of the attribute, or empty if it wasn't found.
 */
function extractAttribute(html, attr) {
	if (!html || !attr) {return '';}
	var exp = new RegExp(attr + '="[^"]*"', 'gi');
	var m = html.match(exp);
	if (m) { // attr="[value]"
		return m[0].split('"')[1];
	} else { // attr='[value]'
		exp = new RegExp(attr + "='[^']*'", 'gi');
		m = html.match(exp);
		if (m) {
			return m[0].split("'")[1];
		}
	}
	
	// No match
	return '';
}

// Export the necessary functions
module.exports.getTerms = getTerms;
module.exports.getPrograms = getPrograms;