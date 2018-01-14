/* Name: core.js
 * Author: Devon McGrath and Martin Tuzim
 * Description: This script contains functions commonly used in the web application.
 */

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
