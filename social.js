/*!
   jQuery WookBar for Blogger
   - Social Buttons
 */

WB.social = {
	load: {
		facebook: function(e, url) {
			var fb = $('span.facebook', e);
			if (fb.length == 0) {
				e.append('<span class="facebook"/>');
				fb = $('span.facebook', e);
			}
			fb.empty();
			fb.append('<iframe src="//www.facebook.com/plugins/like.php?href='+encodeURIComponent(url)+'&amp;send=false&amp;layout=button_count&amp;width=90&amp;show_faces=false&amp;action=like&amp;colorscheme=light&amp;font=verdana&amp;height=20" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:90px; height:21px;" allowTransparency="true"></iframe>');
		},
		google_plus: function(e, url) {
			var gp = $('div[id^=___plusone]', e);
			if (gp.length == 0) {
				e.append('<div class="g-plusone" data-size="medium" data-href="'+url+'"></div>');
				gp = $('div[id^=___plusone]', e);
			} else {
				gp.replaceWith('<div class="g-plusone" data-size="medium" data-href="'+url+'"></div>');
			}
			if (window.gapi && gapi.plusone) gapi.plusone.go();
			else $.getScript('//apis.google.com/js/plusone.js');
		},
		twitter: function(e, url) {
			var twt = $('span.twitter', e);
			if (twt.length == 0) {
				e.append('<span class="twitter"/>');
				twt = $('span.twitter', e);
			}
			twt.empty();
			twt.append('<iframe src="http://platform.twitter.com/widgets/tweet_button.html?url='+encodeURIComponent(url)+'&counturl='+encodeURIComponent(url)+'&text='+document.title+'&via=swookpark&count=horizontal" style="border:none; overflow:hidden; width:90px; height:20px;" allowTransparency="true"></iframe>');
		},
		all: function() {
			var e = $('#topbar-social'),
				urlo = $('<a href="'+url+'"/>')[0],
				url = urlo.protocol +'//'+ urlo.hostname + urlo.port + urlo.pathname;
			WB.social.load.facebook(e, url);
			WB.social.load.google_plus(e, url);
			WB.social.load.twitter(e, url);
			$('iframe', e).each(function(idx, elem) {
				$(elem).hide().load(WB.social.iframe.onload);
			});
		}
	},
	iframe: {
		onload: function() {
			$(this).show();
		}
	}
}

$(document).ready(WB.social.load.all);