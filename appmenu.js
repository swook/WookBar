/*! WookBar by Seon-Wook Park (www.swook.net) | MIT License | appmenu.js */

(function(WB, $, undefined) {
	var UI = WB.UI,
		data = WB.data,
		elem = WB.elem.appmenu,
		util = WB.util;

	elem.blogger = $('a.blogger', elem.main);

	var init = function() {
		handler.attachAll();
	}

	var action = {
		main: {
			focus: function() {
				elem.main.addClass('hover');
				util.clearDelay(action.main.blur);
			},
			blur: function() {
				elem.main.removeClass('hover');
				util.clearDelay(action.main.blur);
			}
		}
	}

	var handler = {
		attachAll: function() {
			elem.main.hover(handler.main.hoverIn, handler.main.hoverOut);
			$('html').click(handler.body.click);
		},
		body: {
			click: function(e) {
				action.main.blur();
			}
		},
		main: {
			hoverIn: function(e) {
				action.main.focus();
			},
			hoverOut: function(e) {
				util.setDelay(action.main.blur, 1000);
			}
		}
	};

	init();
}(window.WB = window.WB || {}, jQuery));