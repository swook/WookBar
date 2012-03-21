/*!
   WookBar for Blogger
   - Search
 */

(function(WB, $, undefined) {
	var UI = WB.UI,
		data = WB.data,
		elem = WB.elem.search,
		util = WB.util;

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
			elem.form.hover(handler.form.hoverIn, handler.form.hoverOut);
			elem.input.on('focus', handler.input.focus).on('blur', handler.input.blur);
		},
		form: {
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
				elem.form.addClass('focus');
			},
			blur: function(e) {
				elem.form.removeClass('focus');
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
