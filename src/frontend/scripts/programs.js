/* Name: programs.js
 * Author: Devon McGrath
 * Description: This script contains functions for the programs.html page.
 */

var progs = [];

/** Gets the list of programs available. */
function getPrograms() {
	getData('/get-programs', function(txt) {
		if (!txt) {txt = '';}
		while (txt.length > 0 && txt.charAt(txt.length - 1) == '\n') {
			txt = txt.substr(0, txt.length - 1);
		}
		progs = txt.split('\n');
	});
}

/** Determines the relevant search results to show. */
function updateSearch() {
	
	var txt = document.getElementById('program').value;
	var res = document.getElementById('program-result');
	res.innerHTML = '';
	
	// No text to match
	if (txt.length == 0) {return -1;}
	
	// Get a match (or close match)
	var html = '', n = progs.length, match = -1, show = 0, LIMIT = 5;
	for (var i = 0; i < n && show < LIMIT; i ++) {
		var p = progs[i];
		if (p == txt) {
			match = i;
			html = '';
			break;
		}
		if (p.search(new RegExp(txt, 'i')) >= 0) {
			html += '<div class="result" onclick="setResult(' + i + ');">' + p + '</div>\n';
			show ++;
		}
	}
	res.innerHTML = html;
	if (match.length > 0) {
		setResult(match);
	}
	
	return match;
}

function setResult(result) {
	if (result < 0 || result >= progs.length) {return;}
	
	// Update the text field and results
	document.getElementById('program').value = progs[result];
	document.getElementById('program-result').innerHTML = '';
	
	// TODO: get list of courses
	// send GET request to '/get-programs?[result]'
}

getPrograms();