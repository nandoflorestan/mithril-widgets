'use strict';

// Solution for micro HTML template interpolation with ES6 strings.
// Variables are HTML-escaped, unless marked with tmpl.trust().
// How to use this? See the test() method.
// Avoid using this! Please realize the security risk in forgetting
// to put the *tmpl.render* prefix before any backtick strings that
// contain HTML code. (ES6 template strings do not escape variables
// and you might not notice the problem until you're attacked.)

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
		replace = String.prototype.replace,
		privateSymbol = Symbol();
	return (Object.freeze || Object)({
		escape: function escape(s) {
			return replace.call(s, reEscape, escapeOne);
		},
		unescape: function unescape(s) {
			return replace.call(s, reUnescape, unescapeOne);
		},
		trust: function (s) {
			const trusted = {};
			trusted[privateSymbol] = s;
			return trusted;
		},
		render: function (pieces) {
			const expressions = [].slice.call(arguments, 1);
			let result = pieces[0];
			for (let i = 0; i < expressions.length; ++i) {
				const val = expressions[i];
				result += (
					val[privateSymbol] === undefined ?
					this.escape(val) : val[privateSymbol]
				) + pieces[i + 1];
			}
			return result;
		},
		test: function () {
			const span = "<span>Filho & Sons</span>";
			const attack = "<script>alert('ouch');</script>";
			const safe = "<p>This is safe.</p>";
			console.assert(
				tmpl.render`
				<p>Variables must be escaped: ${span}</p>
				${attack}
				<p>But don't escape trusted variables:</p>
				${tmpl.trust(safe)}` === `
				<p>Variables must be escaped: &lt;span&gt;Filho &amp; Sons&lt;/span&gt;</p>
				&lt;script&gt;alert(&#39;ouch&#39;);&lt;/script&gt;
				<p>But don't escape trusted variables:</p>
				<p>This is safe.</p>`
			);
		}
	});
}());

export { tmpl }
