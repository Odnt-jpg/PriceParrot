// INITIALIZE GOOGLE ENVIRONMENT
/*
Reference: https://developers.google.com/identity/sign-in/web/devconsole-project

To Remove Google from current application. this code should be deactivated by:
	- Comment all this file;
	- Remove all the code completly
	- Remove <script id="google" type="text/javascript" src="google.js"></script> in index.html (in same folder)
*/

var GoogleClientId = '####'; // Your Google clientId goes here.
var GTMId = 'GTM-TDD9M8R'; // Your Tag Manager container Id


// EXECUTE ON LOAD
(function(d, s, id) {
// Init Google login Api
if (GoogleClientId != '####') {
	if (window.console) console.log('loading: Google Api');
	GoogleLoadScript("https://apis.google.com/js/client.js", GoogleAfterLoad);
	GoogleInit();
}
}());

// INIT GOOGLE API
function GoogleInit() {
	window.onload = function() {
		gapi.client.load('plus', 'v1',function(){});
	};
};

// TO LOAD A SCRIPT DIRECTLY FROM A JAVASCRIPT FILE
function GoogleLoadScript(url, completeCallback) {
	var script = document.createElement('script'), done = false,
		head = document.getElementsByTagName("head")[0];

	script.src = url;
	script.onload = script.onreadystatechange = function(){
		if ( !done && (!this.readyState || this.readyState == "loaded" || this.readyState == "complete") ) {
			done = true;
			completeCallback();

			// IE memory leak
			script.onload = script.onreadystatechange = null;
			head.removeChild( script );
		}
	};
	head.appendChild(script);
}

function GoogleAfterLoad() {
// alert('Script has been loaded.');
};

if (GTMId != '####') {
	<!-- Google Tag Manager -->
	(function (w, d, s, l, i) {
		w[l] = w[l] || [];
		w[l].push({
			'gtm.start':
				new Date().getTime(), event: 'gtm.js'
		});
		var f = d.getElementsByTagName(s)[0],
			j = d.createElement(s), dl = l != 'dataLayer' ? '&l=' + l : '';
		j.async = true;
		j.src =
			'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
		f.parentNode.insertBefore(j, f);
	})(window, document, 'script', 'dataLayer', GTMId);
}


