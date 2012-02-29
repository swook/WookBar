/*!
   jQuery WookBar for Blogger
   - Core File
 */

var WB = {
	l: '#mynavbar .right .cont a',
	u: '#mynavbar .right .cont',
	blog: {
		posts: [],
		pages: []
	},
	data: {
		items: [],
		urls: {}
	},
	init: function() {
		var bloggerData = _WidgetManager._GetAllData().blog;
		WB.blog.title = bloggerData.title;
		WB.blog.homepage = bloggerData.canonicalHomepageUrl;
		WB.blog.id = blogger_blog_id;
		$('#topbar-search')[0].defaultValue = 'Search '+WB.blog.title;

		var parseEntries = function (data, type) {
			var result, ref;
			$.each(data, function(idx, val) {
				result = {};
				result.id = idx;
				result.type = type;
				result.date = new Date(val.published.$t);
				result.title = val.title.$t;
				result.content = val.content.$t;
				result.link = val.link[val.link.length-1].href;
				result.labels = [];
				result.labelsLower = [];
				if ('media$thumbnail' in val) result.thumbnail = val.media$thumbnail.url;
				if (val.category) {
					$.each(val.category, function(i, l) {
						result.labels.push(l.term);
						result.labelsLower.push(l.term.toLowerCase());
					});
				}
				ref = WB.data.items.push(result) - 1;
				WB.data.urls[$.Ajaxify.parseUri(result.link).full] = ref;
				switch (type) {
					case 'post': WB.blog.posts.push(ref);
					case 'page': WB.blog.pages.push(ref);
				}
			});
			result = null;
		};
		$.getJSON('/feeds/posts/default?orderby=published&alt=json',
			function(data) {
				parseEntries(data.feed.entry, 'post');
				data = null;
			}
		);
		$.getJSON('/feeds/pages/default?orderby=published&alt=json',
			function(data) {
				parseEntries(data.feed.entry, 'page');
				data = null;
			}
		);
		delete parseEntries;

		$('#mynavbar form').submit(function(e) {
			e.preventDefault();
		});
		$('#topbar-search').focus(WB.input.focus).blur(WB.input.blur).keydown(WB.input.keydown).keyup(WB.input.keyup);
		$('#mynavbar .right').on('mouseleave', WB.ul.mouseleave).on('mouseenter', WB.ul.mouseenter);
		$('#mynavbar .right .cont').on('mouseleave', WB.ul.mouseleave).on('mouseenter', WB.ul.mouseenter);
		$(document).on('keydown', WB.global_enterTrap.keydown).on('keyup', WB.global_enterTrap.keyup);
	},
	global_enterTrap: {
		keydown: function(e) {
			var input = $('input:focus');
			if (input.length == 0 && e.keyCode == 13) WB.global_enterTrap.pressed = true;
		},
		keyup: function(e) {
			var input = $('input:focus');
			if (WB.global_enterTrap.pressed && input.length == 0 && e.keyCode == 13) $('#topbar-search').focus();
			WB.global_enterTrap.pressed = false;
		},
		pressed: false
	},
	search: function() {
		var field = $('#topbar-search'), val = field.val().toLowerCase().replace(/^\s+|\s+$/g, '');
		if (WB.data.items.length && !("contentText" in WB.data.items[0])) {
			WB.data.items.forEach(function(d) {
				d.contentText = d.content.replace(/(<([^>]+)>)/ig,' ');
				d.snippet = d.contentText.substr(0, 120);
				d.contentTextLower = d.contentText.toLowerCase();
			});
		}
		if (WB.data.lastTerm == val) WB.unhide();
		else if (val == field[0].defaultValue || val == '') {
			WB.showProgress();
			val = '', WB.data.search = [];
			$.each(WB.data.items, function(i,d) {
				if (d.type == 'post') WB.data.search.push({id: i});
			});
			WB.show();
		}
		else {
			WB.showProgress();
			WB.data.search = [];
			var words = val.split(' ');
			$.each(WB.data.items, function(idx, data) {
				var result = {}, point = 0;
				point += (data.title.split(val).length-1)*6/data.title.length;
				point += (data.contentTextLower.split(val).length-1)*4/data.contentTextLower.length;
				$.each(words, function(i, sub) {
					point += (data.title.split(sub).length-1)*1.5/data.title.length;
					point += (data.contentTextLower.split(sub).length-1)*.4/data.contentTextLower.length;;
					$.each(data.labelsLower, function(i, l) {
						if (l.indexOf(sub) > -1) point += 2/data.labelsLower.length;
					});
				});
				result.id = idx;
				result.point = point;
				if (point > 0) {
					WB.data.search.push(result);
					//console.log('['+result.point+'] '+WB.data.items[result.id].title);
				}
			});
			WB.data.search.sort(function(a, b) {
				return b.point - a.point;
			});
			WB.clear();
			WB.show();
		}
		WB.data.lastTerm = val;
	},
	show: function() {
		var newlist = $('<div class="cont"><div class="shadow topshadow"/></div>'), prevDate, showdate;
		if (WB.data.search.length == 0) {
			WB.clear();
			newlist.append($('<a><strong>No Search Results</strong></a>'));
			$('#mynavbar .right').append(newlist);
			WB.endProgress();
			return;
		}

		$.each(WB.data.search, function(idx, data) {
			data = WB.data.items[data.id];
			showdate = false;
			if (prevDate) {
				if (prevDate.getUTCMonth() != data.date.getUTCMonth()) {
					prevDate = data.date;
					showdate = true;
				}
				else if (prevDate.getUTCFullYear() != data.date.getUTCFullYear()) {
					prevDate = data.date;
					showdate = true;
				}
			}
			else prevDate = data.date, showdate = true;
			if (showdate) {
				newlist.append('<div class="date">'+WB.Ajaxify.tmpl.getMonth(data.date.getUTCMonth())+' '+data.date.getUTCFullYear()+'</div>');
			}

			var html, newitem = $('<a href="'+data.link+'" title="'+data.title+'"/>');
			html = '<div class="title">'+data.title+'</div>';
			if ('thumbnail' in data) {
				html += '<img class="thumbnail" src="'+data.thumbnail+'"/>';
			}
			html += '<p class="desc">'+data.snippet+'</p>';
			newitem.html(html);
			newlist.append(newitem);
		});
		newlist.append('<div class="shadow bottomshadow"/><div class="scrollbar"/>');
		$('#mynavbar .right').append(newlist);
		$(WB.l).each(function() {
			$(this).on('click', WB.li.click);
		});
		var ul = $(WB.u), maxh = window.innerHeight-26;
		ul.height('auto');
		if (ul.height() > maxh) {
			ul.height(maxh);
			ul.on('mousemove', WB.ul.mousemove).on('mousedown', WB.ul.mousedown).on('mouseup', WB.ul.mouseup).on('mousewheel', WB.ul.mousewheel);
		}
		WB.ul.scroll(ul[0], 0);
		WB.endProgress();
	},
	showProgress: function() {
		$('#mynavbar .magni').css('background-image','url(http://cdn.swook.net/css/loading.gif)');
	},
	endProgress: function() {
		$('#mynavbar .magni').css('background-image','url(http://cdn.swook.net/css/magni.png)');
	},
	li: {
		click: function(e) {
			var ul = $(WB.u);
			if (($.browser.msie && e.button != 1) || (!$.browser.msie && e.button != 0) || (e.ctrlKey))
				return;

			e.preventDefault();
			if (ul.data('prevY') != ul.data('startY')) return;
			WB.load($(this).attr('href'));
		}
	},
	ul: {
		shadow: function(ul, max) {
			var top = $('.topshadow', ul),
				bottom = $('.bottomshadow', ul);
			if (ul.scrollTop == 0) top.hide();
			else if (ul.scrollTop > 0) top.show();
			if (ul.scrollTop == max) bottom.hide();
			else if (ul.scrollTop < max) bottom.show();

			WB.data.scrollPos = ul.scrollTop;
		},
		scroll: function(ul, dy) {
			if (ul == undefined) ul = $(WB.u)[0];
			var bar = $('.scrollbar', ul),
				ulh = $(ul).innerHeight(),
				max = ul.scrollHeight - ulh,
				barh = ulh / max * ulh;
			if (dy != undefined) ul.scrollTop -= dy;
			WB.ul.shadow(ul, max);
			bar.height(barh);
			bar.stop(true).animate({'top': ul.scrollTop / max * (ulh - barh) + 26},'fast');
		},
		mouseleave: function() {
			WB.delayFadeOut();
		},
		mouseenter: function() {
			var form = $('#topbar-search');
			if (!form.is(':focus')) form.focus();
			WB.search();
		},
		mousemove: function(e) {
			var y = e.pageY-this.offsetTop-window.scrollY,
				h = this.clientHeight,
				offset = y-h/2,
				$this = $(this),
				prevY = $this.data('prevY');
			e.preventDefault();
			if (prevY != y) {
				if (e.which == 1 && $this.data('mousedown')) WB.ul.scroll(this, y - prevY);
				$(WB.l).removeClass('hover').removeClass('nohover');
			}
			$(this).data('prevY', y);
		},
		mouseup: function(e) {
			$(this).data('mousedown', false);
		},
		mousedown: function(e) {
			var startY = e.pageY-this.offsetTop-window.scrollY;
			$(this).data('mousedown', true);
			$(this).data('prevY', startY).data('startY', startY);
			if (e.which == 1) e.preventDefault();
		},
		mousewheel: function(e, d, dX, dY) {
			e.preventDefault();
			WB.ul.scroll(this, dY*25);
		}
	},
	input: {
		focus: function(e) {
			if (this.value == this.defaultValue) {
				this.value = '';
				$(this).removeClass('defaultInput');
			}
			WB.search();
		},
		blur: function(e) {
			if (this.value == '') {
				this.value = this.defaultValue;
				$(this).addClass('defaultInput');
			}
			if (!$(WB.u).is(':hidden')) WB.fadeOut();
		},
		keydown: function(e) {
			if (e.keyCode == 33 || e.keyCode == 34 || e.keyCode == 38 || e.keyCode == 40) {
				e.preventDefault();
			}
			$(this).data('pressedKey', e.keyCode);
		},
		keyup: function(e) {
			var $this = $(this);
			if ($this.data('pressedKey') != e.keyCode) {
				$this.data('pressedKey', null);
				return;
			}
			WB.input.key_switch(e);
			$this.data('pressedKey', null);
		},
		key_switch: function(e) {
			switch (e.keyCode) {
				case 13:
					WB.input.submit();
					break;
				case 33:
				case 34:
				case 38:
				case 40:
					WB.input.keyup_arrow(e);
					break;
				case 27:
					WB.input.keyup_esc(e);
					break;
				default:
					if (e.keyCode == 8 || String.fromCharCode(e.keyCode) > '') WB.search();
			}
		},
		keyup_arrow: function(e) {
			e.preventDefault();
			var hovered = $(WB.l+':hover'), skip = 1,
				selected = $(WB.l+'.hover'), next, cur,
				ul = $(WB.u),
				lis = $(WB.l), len = lis.length;

			if (e.keyCode == 33 || e.keyCode == 34) skip = 2;

			if ((hovered.length+selected.length) == 0) {
				if (e.keyCode == 33 || e.keyCode == 38)
					next = len-1;
				else if (e.keyCode == 34 || e.keyCode == 40)
					next = 0;
			}
			else {
				if (selected.length == 0) cur = lis.index(hovered);
				else cur = lis.index(selected);
				if (e.keyCode == 33 || e.keyCode == 38)
					next = cur-skip;
				else if (e.keyCode == 34 || e.keyCode == 40)
					next = cur+skip;
			}
			if (next < 0) {
				if (cur == 0) next = len-1;
				else next = 0;
			}
			else if (next > (len-1)) {
				if (cur == (len-1)) next = 0;
				else next = len-1;
			}
			next = lis.eq(next);
			lis.removeClass('hover');
			lis.addClass('nohover');
			next.removeClass('nohover');
			next.addClass('hover');

			var curpos = ul[0].scrollTop,
				tarpos = next[0].offsetTop,
				diff = tarpos - curpos,
				uh = ul.innerHeight(),
				mh = uh-next.innerHeight(),
				target,
				bar = $('.scrollbar', ul),
				max = ul[0].scrollHeight - uh,
				barh = uh / max * uh;
			bar.stop(true);
			if (diff > mh) target = tarpos - mh;
			else if (diff < 0) target = tarpos;
			ul.stop(true).animate(
				{scrollTop: target},
				{
					step: function(st) {
						bar.css('top', st / max * (uh - barh) + 26);
					},
					queue: false,
					complete: function() {
						WB.ul.shadow(ul[0], max);
					}
				}
			);
		},
		keyup_esc: function(e) {
			$(this).blur();
			WB.fadeOut();
		},
		submit: function() {
			var val = $('#topbar-search').val();
			if (WB.data.search.length > 0) {
				var selected = $(WB.l+'.hover');
				if (selected.length == 0) {
					selected = $(WB.l+':hover');
					if (selected.length == 0) {
						$(WB.l+':first').addClass('hover');
						WB.load(WB.data.items[WB.data.search[0].id].link);
						return;
					}
				}
				WB.load(selected.eq(0).attr('href'));
			}
		}
	},
	delay: function(f) {
		if (WB.timeout) clearTimeout(WB.timeout);
		WB.timeout = setTimeout(f, 3000);
	},
	timeout: null,
	clear: function() {
		var ul = $(WB.u);
		if (ul.length) ul.stop(true).remove();
		WB.data.scrollPos = 0;
	},
	unhide: function() {
		var ul = $(WB.u), maxh = window.innerHeight-26;
		ul.stop(true).show().css('opacity', 1).height('auto');
		if (ul.height() > maxh) ul.height(maxh);
		ul[0].scrollTop = WB.data.scrollPos;
		if (WB.timeout) clearTimeout(WB.timeout);
	},
	hide: function() {
		$(this).hide();

		// This line has to come after the .hide()
		// as the blur handler tries to hide list as well
		$('#topbar-search').blur();
		$(WB.l).removeClass('hover').removeClass('nohover');
	},
	fadeOut: function() {
		var ul = $(WB.u);
		ul.stop(true).fadeOut(WB.hide);
	},
	delayFadeOut: function() {
		var ul = $(WB.u);
		ul.stop(true);
		WB.delay(function() {
			ul.fadeOut(WB.hide)
		});
	},
	load: function(url) {
		var urlo = $('<a href="'+url+'"/>')[0];
		url = urlo.protocol +'//'+ urlo.hostname + urlo.port + urlo.pathname;
		if (url != document.location.origin + document.location.pathname) WB.showProgress();
		WB.fadeOut();
		document.location.href = url;
	},
};
$(document).ready(WB.init);