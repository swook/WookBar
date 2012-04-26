/*! WookBar by Seon-Wook Park (www.swook.net) | CC BY-NC-SA | ajaxify.js */

(function(WB, $, undefined) {
	var UI = WB.UI,
		data = WB.data,
		elem = WB.elem,
		util = WB.util;

	$.Ajaxify.parseUri = util.parseURL;
}(window.WB = window.WB || {}, jQuery));

/*
WB.load = function(url) {
	url = $.Ajaxify.parseUri(url);
	if (url.full != $.Ajaxify.current_url.full) WB.showProgress();
	WB.fadeOut();
	WB.Ajaxify.BloggerLoad(url);
}

WB.Ajaxify = {
	init: function() {
		$.Ajaxify.all();
	},
	pageChange: function() {
		WB.endProgress();
		WB.fadeOut();

		var pageName;
		$.each(WB.data.items, function(key, val) {
			if (val.link == $.Ajaxify.current_url.full) {
				pageName = val.title;
				return;
			}
		});
		if (!pageName) pageName = (document.title == WB.blog.title) ? '' : document.title;
		$('#mynavbar .page').html(pageName).attr('href', $.Ajaxify.current_url.full);

		$('.tabs-inner li').each(function() {
			var $this = $(this), target = $('a',$this).attr('href');
			if (target) {
				if (target == document.location.href) $this.addClass('selected');
				else $this.removeClass('selected');
			}
		});
		if ('social' in WB) WB.social.load.all();
	},
	onClick: function(e) {
		if (($.browser.msie && e.button != 1) || (!$.browser.msie && e.button != 0) || (e.ctrlKey))
			return;

		e.preventDefault();
		var url = $.Ajaxify.parseUri($(this).attr('href'));
		if ((url.full in WB.data.urls) || url.path == '' || url.path == '/' || url.path == '/search') WB.Ajaxify.BloggerLoad(url);
		else $.Ajaxify.loadURL(url);
	},
	BloggerLoad: function(url) {
		if ($.Ajaxify.current_url.full == url.full) {
			$.Ajaxify.gotoAnchor(url.anchor);
			return;
		}

		var data, title;
		if (url.path == '' || url.path == '/' || url.path == '/search') title = WB.blog.title;
		else {
			data = WB.data.items[WB.data.urls[url.full]],
			title = (data.title == 'About') ? 'Seon-Wook Park' : data.title;
		}
		document.title = title;
		history.pushState(
			{
				url: url,
				title: title
			},
			title,
			url.relative
		);
		$.Ajaxify.init();
		WB.Ajaxify.applyData(url, data);
		setTimeout($.get(url.full+'?dynamicviews=1&v=0'), 0);
	},
	applyData: function (url, data) {
		if (url.path == '' || url.path == '/') WB.Ajaxify.home();
		else if (url.path == '/search') WB.Ajaxify.pager(url);
		else if (url.full in WB.data.urls) {
			data = WB.data.items[WB.data.urls[url.full]];
			$('#Blog1').empty();
			$('#Blog1').html(WB.Ajaxify.tmpl.compile.body(data, data.type == 'post'));
		}
		$('#Blog1 div.blogger-post-footer').remove();
		$('#Label1 span span[dir=ltr]').each(function(i, e) {
			var $e = $(e), label = $e.html();
			$e.replaceWith('<a dir="ltr" href="'+WB.blog.homepage+'search/label/'+label+'">'+label+'</a>');
			$.Ajaxify.applyTo($e);
		});
		$('#Blog1 a[target!=_blank]:not(.noajax)').each($.Ajaxify.applyTo);
		$.Ajaxify.pageChange_run();
		$.Ajaxify.gotoAnchor(url.anchor);
	},
	tmpl: {
		getDay: function(i) {
			switch(i) {
				case 0: return "Sunday";
				case 1: return "Monday";
				case 2: return "Tuesday";
				case 3: return "Wednesday";
				case 4: return "Thursday";
				case 5: return "Friday";
				case 6: return "Saturday";
			}
		},
		getMonth: function(i) {
			switch(i) {
				case 0: return "January";
				case 1: return "February";
				case 2: return "March";
				case 3: return "April";
				case 4: return "May";
				case 5: return "June";
				case 6: return "July";
				case 7: return "August";
				case 8: return "September";
				case 9: return "October";
				case 10: return "November";
				case 11: return "December";
			}
		},
		parse: {
			uriParams: function(uri) {
				uri.params = {};
				uri.query.split('&').map(function(pair) {
					pair = pair.split('=');
					if (pair.length == 2) uri.params[pair[0]] = pair[1].replace(/\+/g, ' ');
					else uri.params[pair[0]] == null;
				});
				if ('max-results' in uri.params) uri.params['max-results'] = parseInt(uri.params['max-results']);
				if ('reverse-paginate' in uri.params) uri.params['reverse-paginate'] = (uri.params['reverse-paginate'] == 'true');
				if ('updated-max' in uri.params) uri.params['updated-max'] = new Date(decodeURIComponent(uri.params['updated-max']));
				return uri;
			}
		},
		compile: {
			uriParams: function(uri) {
				if (!('params' in uri)) return '';
				var str = uri.protocol+'://'+uri.host+uri.path+'?', params = [];
				for (key in uri.params) {
					params.push(key+'='+uri.params[key]);
				}
				return str+params.join('&');
			},
			bloggerTime: function(date) {
				var str = date.toISOString();
				return str.slice(0, str.length-5)+'Z';
			},
			date: function(data) {
				return '<h2 class="date-header"><span>'+WB.Ajaxify.tmpl.getDay(data.date.getUTCDay())+', '+data.date.getUTCDate()+' '+WB.Ajaxify.tmpl.getMonth(data.date.getUTCMonth())+' '+data.date.getUTCFullYear()+'</span></h2>';
			},
			body: function(data, showdate, contentkey) {
				contentkey = (contentkey) ? contentkey : 'content';
				var html = '<div class="blog-posts hfeed"><div class="date-outer">';
				if (showdate) html += WB.Ajaxify.tmpl.compile.date(data);
				html += '<div class="date-posts"><div class="post-outer"><div class="post hentry">';

				if (data.type == 'post') {
					html += '<h3 class="post-title entry-title">';
					if (contentkey == 'contentLess') html += '<a href="'+data.link+'">';
					html += data.title;
					if (contentkey == 'contentLess') html += '</a>';
					html += '</h3><div class="post-header"><div class="post-header-line-1"><span class="post-author vcard">by <span class="fn"><a href="/p/about.html">Seon-Wook Park</a></span></span></div></div>';
				}

				html += '<div class="post-body entry-content">'+data[contentkey]+'</div>';
				if (data.more && contentkey == 'contentLess') html += '<div class="jump-link"><a href="'+data.link+'#more" title="'+data.title+'">Continue Reading →</a></div>';
				html += '<div class="post-footer"><div class="post-footer-line post-footer-line-1"><div class="post-share-buttons goog-inline-block"><div addthis:description="..." addthis:title="'+data.title+'" addthis:url="'+$.Ajaxify.current_url.full+'" class="addthis_toolbox addthis_default_style" style="width: 150px;"><a class="addthis_button_preferred_1"></a><a class="addthis_button_preferred_2"></a><a class="addthis_button_preferred_3"></a><a class="addthis_button_preferred_4"></a><a class="addthis_button_compact"></a></div></div></div><div class="post-footer-line post-footer-line-2"><span class="post-comment-link"><a class="comment-link" href="'+data.link+'#comments"></a></span>';

				if (data.type == 'post' && data.labels.length > 0) {
					html += '<span class="post-labels">Tags: ';
					$.each(data.labels, function(i, l) {
						if (i > 0) html += ', ';
						html += '<a href="'+WB.blog.homepage+'search/label/'+l+'" rel="tag">'+l+'</a>';
					});
					html += '</span>';
				}

				html += '</div><div class="post-footer-line post-footer-line-3"></div></div></div>';
				if (contentkey == 'content') html += '<div class="comments" id="comments"></div>';
				html += '</div></div></div>';
				return html;
			},
			index: function(ids) {
				var prevDate, data, showdate, html = '';
				ids.forEach(function(idx) {
					data = WB.data.items[idx], showdate = false;
					if (prevDate) {
						if (prevDate.getUTCDay() != data.date.getUTCDay()) {
							prevDate = data.date;
							showdate = true;
						}
						else if (prevDate.getUTCDate() != data.date.getUTCDate()) {
							prevDate = data.date;
							showdate = true;
						}
						else if (prevDate.getUTCFullYear() != data.date.getUTCFullYear()) {
							prevDate = data.date;
							showdate = true;
						}
					}
					else prevDate = data.date, showdate = true;

					html += WB.Ajaxify.tmpl.compile.indexItem(data, showdate);
				})
				return html;
			},
			indexItem: function(data, showdate) {
				if (!('contentLess' in data)) {
					var idx = data.content.indexOf("<a name='more'></a>");
					data.more = (idx > -1);
					if (data.more) data.contentLess = data.content.substr(0, idx);
					else return WB.Ajaxify.tmpl.compile.body(data, showdate, 'content');
				}
				return WB.Ajaxify.tmpl.compile.body(data, showdate, 'contentLess');
			},
			pager: function(url, first, last) {
				var html = '<div class="blog-pager" id="blog-pager">',
					param = {};
				if ('max-results' in url.params) param['max-results'] = url.params['max-results'];
				if (first.id > 0) {
					html += '<span id="blog-pager-newer-link"><a class="blog-pager-newer-link" href="';
					if (first.id > url.params['max-results']) {
						param['updated-max'] = WB.Ajaxify.tmpl.compile.bloggerTime(WB.data.items[WB.blog.pages[first.id-url.params['max-results']-1]].date);
						param['reverse-paginate'] = true,
						url.params = param;
						html += WB.Ajaxify.tmpl.compile.uriParams(url);
					}
					else html += WB.blog.homepage;
					html += '" id="Blog1_blog-pager-newer-link" title="Newer Posts">Newer Posts</a></span>';
				}
				if (last.id < WB.blog.posts.length-1) {
					param['updated-max'] = WB.Ajaxify.tmpl.compile.bloggerTime(last.date);
					url.params = param;
					html += '<span id="blog-pager-older-link"><a class="blog-pager-older-link" href="'+WB.Ajaxify.tmpl.compile.uriParams(url)+'" id="Blog1_blog-pager-older-link" title="Older Posts">Older Posts</a></span>';
				}
				html += '</div>';
				return html;
			}
		}
	},
	home: function() {
		var items = [], url = $.extend({}, $.Ajaxify.parseUri(WB.blog.homepage)), maxitems = 4;
		url.path = '/search';
		url.params = {
			'max-results': maxitems
		}
		for (var i = 0; i < WB.blog.posts.length; i++) {
			if (items.push(WB.blog.posts[i]) == maxitems) break;
		}
		html = WB.Ajaxify.tmpl.compile.index(items);
		html += WB.Ajaxify.tmpl.compile.pager(url, WB.data.items[items[0]], WB.data.items[items[items.length-1]]);
		$('#Blog1').empty();
		$('#Blog1').html(html);
	},
	pager: function(url) {
		url = $.extend({}, WB.Ajaxify.tmpl.parse.uriParams(url));
		var html, check, data, items = [],
			maxitems = url.params['max-results'],
			refdate = ('updated-max' in url.params) ? url.params['updated-max'] : new Date();
		for (var i = 0; i < WB.data.items.length; i++) {
			data = WB.data.items[i];
			if ((data.type == 'post') && (data.date < refdate)) items.push(i);
			if (items.length == maxitems) break;
		}
		html = WB.Ajaxify.tmpl.compile.index(items);
		html += WB.Ajaxify.tmpl.compile.pager(url, WB.data.items[items[0]], WB.data.items[items[items.length-1]]);
		$('#Blog1').empty();
		$('#Blog1').html(html);
	}
}
$.Ajaxify.onClick = WB.Ajaxify.onClick;
$.Ajaxify.pageChange(WB.Ajaxify.pageChange);
$(document).ready(WB.Ajaxify.init);
*/