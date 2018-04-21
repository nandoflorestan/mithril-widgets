'use strict';

// Solution for safe HTML template interpolation with ES6 strings.
// Variables are HTML-escaped, unless marked with tmpl.trust().
// How to use this? See the test() method

const tmpl = (function () {
	const
		reEscape = /[&<>'"]/g,
		reUnescape = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34);/g,
		oEscape = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			"'": '&#39;',
			'"': '&quot;'
		},
		oUnescape = {
			'&amp;': '&',
			'&#38;': '&',
			'&lt;': '<',
			'&#60;': '<',
			'&gt;': '>',
			'&#62;': '>',
			'&apos;': "'",
			'&#39;': "'",
			'&quot;': '"',
			'&#34;': '"'
		},
		escapeOne = function (m) {
			return oEscape[m];
		},
		unescapeOne = function (m) {
			return oUnescape[m];
		},
		replace = String.prototype.replace;
	return (Object.freeze || Object)({
		escape: function escape(s) {
			return replace.call(s, reEscape, escapeOne);
		},
		unescape: function unescape(s) {
			return replace.call(s, reUnescape, unescapeOne);
		},
		trust: function (s) {
			return {_trustedAsHTML: s};
		},
		render: function (pieces) {
			const substitutions = [].slice.call(arguments, 1);
			let result = pieces[0];
			for (let i = 0; i < substitutions.length; ++i) {
				const val = substitutions[i];
				result += (val._trustedAsHTML ? val._trustedAsHTML
					: this.escape(val)) + pieces[i + 1];
			}
			return result;
		},
		test: function () {
			const ampersand = "&";
			const div = "<div>";
			const safe = "<p>This is safe.</p>";
			console.assert(
				tmpl.render`
				<p>Variables must be escaped: ${ampersand}</p>
				<p>Another example: ${div}</p>
				<p>But don't escape trusted variables:</p>
				${tmpl.trust(safe)}` === `
				<p>Variables must be escaped: &amp;</p>
				<p>Another example: &lt;div&gt;</p>
				<p>But don't escape trusted variables:</p>
				<p>This is safe.</p>`
			);
		}
	});
}());
