'use strict';

// This module contains widgets for Mithril and Bootstrap 4.
// But first, let's add a couple useful methods to js data types.

Object.defineProperty(Object.prototype, 'extend', {
	writable: false,
	configurable: false,
	enumerable: false,
	value: function (src) {
		if (src === null) return this;
		var self = this;
		Object.keys(src).forEach(function(key) { self[key] = src[key]; });
		return this;
	}
});

Object.defineProperty(Object.prototype, 'pop', {
	writable: false,
	configurable: false,
	enumerable: false,
	value: function (key) {
		var value = this[key];
		delete this[key];
		return value;
	}
});

Object.defineProperty(Array.prototype, 'contains', {value: function (o) {
	return this.indexOf(o) != -1;
}});

Array.prototype.sortBy = function (key, desc) {
	return this.sort(function(a, b) {
		var x = a[key];
		var y = b[key];
		if (typeof x === "string") {
			x = x.toLowerCase();
		}
		if (typeof y === "string") {
			y = y.toLowerCase();
		}
		if (desc) {
			return (x > y) ? -1 : ((x < y) ? 1 : 0);
		} else {
			return (x < y) ? -1 : ((x > y) ? 1 : 0);
		}
	});
};


class UL { // Unordered list
	constructor(attrs, items) {
		this.attrs = attrs;
		this.items = items;
	}
	view() {
		return m('ul', this.attrs, this.items.map((i) => m('li', i)));
	}
}


class Notification {  // TODO icons
	constructor(d) {
		this.extend(d);
		if (!this.level)  this.level = 'warning';
		if (Notification.levels.indexOf(this.level) === -1)
			console.error('Message with wrong level:', this);
	}
	get readingTime() {
		// Estimate the time one takes to read some text
		let len = 0;
		if (this.title) len += this.title.length;
		if (this.html)  len += this.html.length;
		if (this.plain) len += this.plain.length;
		let duration = len * Notification.speed;
		if (duration < Notification.min)  return Notification.min;
		else return duration;
	}
	view() {
		return m('div.notification', [
			this.title ? m('h5', this.title) : null,
			this.html ? m.trust(this.html) : this.plain,
		]);
	}
}
Notification.levels = ['success', 'info', 'secondary', 'light', 'dark', 'warning', 'danger'];
Notification.speed = 90; // Takes one second to read 11 chars
Notification.min = 3000; // but the minimum is 3 seconds

var Notifier = { // A position:fixed component to display toasts
	history: [],
	index: -1,
	phase: 'off', // off, starting, on, fading out
	timeOut: -1,
	statuses: {},
	statusIndex: 0,
	getCurrent: function () {
		if (this.index === -1) return null;
		return this.history[this.index];
	},
	add: function (o) {
		this.history.push(new Notification(o));
		if (this.phase === 'off') {
			this.next();
		}
	},
	next: function () {
		let self = Notifier;
		window.clearTimeout(self.timeOut); // in case button pressed

		if (self.phase === 'off') {
			self.phase = 'starting'; // fade out the main msg
			self.timeOut = window.setTimeout(self.next, 200);
		}
		else if (['starting', 'fading out'].contains(self.phase)) {
			self.phase = 'on'; // show current msg
			++self.index;
			self.timeOut = window.setTimeout(self.next, self.getCurrent().readingTime);
		}
		else if (self.phase === 'on') {
			// Turn self off or fade out for next message
			if (self.index === self.history.length - 1) {
				self.phase = 'off';
			} else {
				self.phase = 'fading out';
				self.timeOut = window.setTimeout(self.next, 200);
			}
		}
		else {
			throw "Notifier phase could not be cycled.";
		}
		m.redraw();
	},
	prev: function () { // prev button was pressed
		let self = Notifier;
		window.clearTimeout(self.timeOut);
		self.index = self.index - (self.phase === 'off' ? 1 : 2);
		self.phase = 'starting';
		self.next();
	},
	addStatus: function (status) {
		++this.statusIndex;
		this.statuses[this.statusIndex] = status;
		m.redraw();
		return this.statusIndex;
	},
	rmStatus: function (handle) {
		delete this.statuses[handle];
		m.redraw();
	},
	view: function () {
		let dis = ['off', 'starting'].contains(this.phase);
		var content, level;
		if (dis) { // display status
			var statstrings = Object.values(this.statuses);
			content = m('small', statstrings.length ?
				m(new UL(null, statstrings)) : 'Notifications');
			level = 'dark';
		} else { // display a message
			let cur = this.getCurrent();
			content = cur.view();
			level = cur.level;
		}
		let cls = ['starting', 'fading out'].contains(this.phase) ? '.fade-out' : '';
		let arr = [];
		if (!dis) {
			arr.push(m('button[title="Dismiss"]', {onclick: Notifier.next}, '×'));
		}
		if (this.index > 0) {
			arr.push(m('button[title="Previous"]', {onclick: Notifier.prev}, '<'));
		}
		arr.push(content);
		return m(`.notifier${cls}.alert.alert-${level}[role="alert"]`, arr);
	},
};


function request(d) { // Lets user know a request is in progress
	let notifier = d.pop('notifier') || Notifier;
	let handle = d.status ? notifier.addStatus(d.status) : null;
	d.withCredentials = true;
	let promise = m.request(d);
	let ret = {then: function (callback) { this.callback = callback; }};
	promise.then(function (response) {
		if (handle)  notifier.rmStatus(handle);
		if (ret.callback) return ret.callback(response);
		return response;
	});
	return ret;
}


class SimpleTable { // params: classes: str, headers: arr, rows: arr of arrays
	constructor(attrs) {
		this.extend(attrs);
	}
	view() {
		return m('table' + (this.classes || '.table .table-bordered'), [
			m('thead', this.headers.map(h => m('th', h))),
			m('tbody', this.rows.map(r => m('tr',
				r.map(txt => m('td', txt)),
			))),
		]);
	}
}


class SortedTable {
	// The constructor takes these params and sorts the data:
	// classes: str,
	// headers: [{key: sort_key, title: title}...],
	// rows: array of objects,
	// sortKey: str (indicating the initial sorted column),
	// desc: bool (for descending sort),
	// formatter: object containing functions to generate the displayed value for each column (e. g. to create links)
	constructor(attrs) {
		this.extend(attrs);
		this.formatter = this.formatter || {};
		this.sort();
	}
	sort() {
		this.rows = this.rows.sortBy(this.sortKey, this.desc);
	}
	view() {
		let arrow = this.desc ? ' ↘' : ' ↗';
		return m('table' + (this.classes || '.table .table-bordered .table-hover'), [
			this.caption ? m('caption[style="caption-side:top"]', this.caption) : null,
			m('thead[title="Click on a column header to sort"]', this.headers.map(h => m('th[style="cursor:pointer;"]',
				{
					onclick: (e) => this.headerClick(e, this),
					"data-key": h.key, "data-title": h.title,
				}, [
					h.title,
					(this.sortKey === h.key ? arrow : ''),
				],
			))),
			m('tbody', this.rows.map(o => m('tr',
				this.headers.map(h => m('td',
					this.formatter[h.key] ?
					this.formatter[h.key](o) :
					o[h.key],
				)),
			))),
		]);
	}
	headerClick(e, self) {  // When user clicks on a table header, sort table
		let dat = e.target.dataset;
		let sortKey = dat.key;
		if (self.sortKey === sortKey) {
			self.desc = !self.desc;
		} else {
			self.sortKey = sortKey;
			self.desc = false;
		}
		self.sort();
		var displayDesc = self.desc ? ' (descending)' : '';
		Notifier.add({
			level: 'success',
			plain: `The table is now sorted by "${dat.title}"${displayDesc}.`,
		});
	}
}


class Option {  // for <select>. Args: ins, value, selected, title
	view(vnode) {
		let bag = vnode.attrs;
		let attrs = {
			value: bag.value,
			selected: bag.selected ? 'selected' : undefined,
			title: bag.title || undefined
		};
		return m('option', attrs, bag.ins);
	}
}


// TODO Icons with http://fontawesome.io/cheatsheet/
class SelectNav {  // Simple nav menu, supporting images and Selects
	constructor(vnode) {
		let att = vnode.attrs;
		this.permanent = att.permanent || [];
		this.collapsable = att.collapsable;
		this.classes = att.classes || '';
		// ".navbar-expand-lg.navbar-dark.bg-dark"
	}
	renderMany(entries) {
		// return entries.map((x) => this.renderOne(x));
		let arr = [];
		for (let entry of entries) {
			arr.push(this.renderOne(entry));
		}
		return arr;
	}
	renderOne(entry) {          // TODO add .active
		if (entry.img){
			let attrs = {
				src: entry.img,
				alt: entry.alt,
				style: entry.style || 'margin-right:1rem;',
			}.extend(entry.attrs);
			return m(
				"a.nav-link",
				{href: entry.url, title: entry.tooltip}, m("img", attrs),
			);
		} else if (entry.children.length > 0) {
			return m(
				"select", {
					onchange: m.withAttr('value', this.navigate),
					style: entry.style || 'margin-right:1rem;',
				},
				this.options(entry));
		} else {
			return m(
				"a.nav-link",
				{href: entry.url, title: entry.tooltip}, entry.label);
		}
	}
	navigate(url) {
		console.log('navigate', url);
		if (url === '##') { // TODO NOT NECESSARY ANYMORE?
			return false;
		} else {
			window.location = url;
		}
	}
	options(entry) {
		return [
			this.option(entry),
			m('optgroup', {label: "Navigate to:"},
				entry.children.map(c => this.option(c))),
		];
	}
	option(entry) {
		return m(Option, {
			ins: entry.label, value: entry.url, title: entry.tooltip});
		// return m(
		// 	'option', {title: entry.tooltip || undefined, value: entry.url}, entry.label);
	}
	/*
		m("li.nav-item.dropdown",
			[
				m("a.nav-link.dropdown-toggle[aria-expanded='false'][aria-haspopup='true'][data-toggle='dropdown'][href='#'][id='navbarDropdown'][role='button']",
					"Dropdown"
				),
				m(".dropdown-menu[aria-labelledby='navbarDropdown']",
					[
						m("a.dropdown-item[href='#']",
							"Action"
						),
						m("a.dropdown-item[href='#']",
							"Another action"
						),
						m(".dropdown-divider"),
						m("a.dropdown-item[href='#']",
							"Something else here"
						)
					]
				)
			]
		), */
	renderToggler(contents) {
		return [
			m("button.navbar-toggler[aria-controls='navbarSupportedContent'][aria-expanded='false'][aria-label='Toggle navigation'][data-target='#navbarSupportedContent'][data-toggle='collapse'][type='button']",
				m("span.navbar-toggler-icon")
			),
			m(".collapse.navbar-collapse[id='navbarSupportedContent']",
				m("ul.navbar-nav.mr-auto", contents)
			)
		];
	}
	view() {
		var c = [];
		if (this.collapsable) {
			c = this.renderToggler(this.renderMany(this.collapsable));
		}
		return m("nav.navbar" + this.classes,
			this.renderMany(this.permanent).concat(c)
		);
	}
}


class SearchBox {
	// In order to observe this, set onchange: function (value) {...}
	constructor(attrs) {
		this.showNoResults = false;
		this.extend(attrs);
		this.inputAttrs = this.inputAttrs || {};
		this.inputAttrs.onkeyup = this.inputAttrs.onkeyup ||
			((e) => this.keyup.apply(this, [e]));
	}
	view(vnode) {
		// Why "self" in view()? You'd expect *this* to refer to this instance,
		// but Mithril makes it an object whose prototype is this instance.
		let self = vnode.tag;
		return m('.searchbox', [
			m('.input-group', [
				m('input.form-control.search[type=text][placeholder=Press Enter to search][aria-label=Search]', self.inputAttrs),
				m('.input-group-append',
					m('button.btn.btn-outline-secondary[type=button][title=Clear search]', {onclick: (e) => self.clear.apply(self, [e])}, '×')),
			]),
			self.showNoResults ? m('.no-results', 'This search yields no results.') : null,
		]);
	}
	keyup(e) {
		if (e.keyCode === 13) {
			this.setValue(e.target.value);
		}
	}
	setValue(val) {
		this.value = val;
		this.showNoResults = false;
		if (this.onchange)  this.onchange(this.value);
	}
	clear(e) {
		const input = e.target.parentNode.previousSibling;
		input.value = '';
		input.focus();
		this.setValue('');
	}
	hadNoResults() {
		this.showNoResults = true;
	}
}


class ContentEditable { // TODO Observer in order to POST edited content
	// from http://jsbin.com/vihuyi/edit?js,output
	constructor(text) {
		this._text = text;
	}
	get text() {
		return this._text;
	}
	set text(val) {
		this._text = val;
	}
	view() {
		return m('div', {
			contenteditable: true,
			onchange: m.withAttr('innerText', (t) => this.text = t),
		}, m.trust(this.text));
	}
}
