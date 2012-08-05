/*! WookBar by Seon-Wook Park (www.swook.net) | CC BY-NC-SA | search.js */

(function(WB, $, undefined) {
	var UI = WB.UI,
		data = WB.data,
		elem = WB.elem.search,
		util = WB.util;

	elem.submit = $('input[type=submit]', elem.form);
	elem.results = $('div.results', elem.main);

	var init = function() {
		handler.attachAll();
	}

	var action = {
		input: {
			focus: function() {
				elem.input.focus();
			},
			blur: function() {
				elem.input.blur();
			}
		}
	}

	var handler = {
		attachAll: function() {
			elem.main.hover(handler.main.hoverIn, handler.main.hoverOut);
			elem.input.on('focus', handler.input.focus).on('blur', handler.input.blur);

			// Resize results div on window resize
			$(window).resize(handler.window.resize);
			handler.window.resize();
		},
		window: {
			resize: function(e) {
				elem.results.css('max-height', window.innerHeight-26);
			}
		},
		main: {
			hoverIn: function(e) {
				util.clearDelay(action.input.blur);
				action.input.focus();
			},
			hoverOut: function(e) {
				if (elem.input.is(':focus')) util.setDelay(action.input.blur, 3000);
				else action.input.blur();
			}
		},
		input: {
			focus: function(e) {
				elem.main.addClass('focus');
			},
			blur: function(e) {
				elem.main.removeClass('focus');
			}
		},
		submit: {
			submit: function(e) {
				e.preventDefault();
			}
		}
	};

	init();
}(window.WB = window.WB || {}, jQuery));
