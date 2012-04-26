/*! WookBar by Seon-Wook Park (www.swook.net) | MIT License | util.js */

(function(WB, $, undefined) {
	var urlcache = {};
	function parseURL(url) {
		if (!url) url = document.URL;
		if (url in urlcache) return urlcache[url];
		var urlo = (url == document.URL) ? document.location : $('<a href="'+url+'"/>')[0],
			urlp = {
				protocol: urlo.protocol.slice(0, urlo.protocol.length - 1),
				host: urlo.hostname,
				port: urlo.port,
				path: urlo.pathname,
				query: urlo.search,
				params: urlo.search.length ? (function() {
						var param = [], params = {};
						$.each(urlo.search.slice(1).split('&'), function(i, e) {
							if (e.length) {
								param = e.split('=');
								if (param[1].length) params[param[0]] = param[1];
							}
						});
						return params;
					}()) : '',
				file: urlo.pathname.match(/\/([^\/?&]*)[^\/]*$/)[1],
				hash: urlo.hash.length ? urlo.hash.slice(1) : '',
				relative: urlo.href.match(/:\/\/[^\/]+(.*)$/)[1],
				full: urlo.href.match(/([^#]*)/)[1],
				full_hash: urlo.href
			};
		if (url == urlo.href) urlcache[url] = urlp;
		if (urlo instanceof jQuery) urlo.remove();
		return urlp;
	};

	var delays = [];
	function setDelay(func, duration) {
		var search, fname = murmurhash3_32_gc(this.toString()+func.toString());
		$.each(delays, function(i, e) {
			if (e.func == fname) {
				search = e;
				return false;
			}
		});
		var timeout = setTimeout(func, duration, [].splice.call(arguments, 2));
		if (search != undefined) {
			clearTimeout(search.timeout);
			search.timeout = timeout;
		} else {
			delays.push({
				func: fname,
				timeout: timeout
			});
		}
	}
	function clearDelay(func) {
		var fname = murmurhash3_32_gc(this.toString()+func.toString());
		$.each(delays, function(i, e) {
			if (e.func == fname) {
				clearTimeout(e.timeout);
				return false;
			}
		});
	}
	WB.util = {
		parseURL: parseURL,
		setDelay: setDelay,
		clearDelay: clearDelay
	};
}(window.WB = window.WB || {}, jQuery));
