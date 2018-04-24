'use strict';

// PART 1: add a couple useful methods to js data types.

Object.defineProperty(Object.prototype, 'pop', {
	writable: false,
	configurable: false,
	enumerable: false,
	value: function (key) {  // Return the value and remove *key* from this
		var value = this[key];
		delete this[key];
		return value;
	}
});

Object.defineProperty(Array.prototype, 'contains', {value: function (o) {
	return this.indexOf(o) != -1;
}});

Object.defineProperty(Object.prototype, 'deepValue', {
	writable: false,
	configurable: false,
	enumerable: false,
	value: function (key) { // Example key: "person.address.street"
		// Traverse this object to return the value of a structured key
		const keyParts = key.split('\.'); // split *key* by dot
		let val = this;
		for (const k of keyParts)  {
			val = val[k];
			if (val === undefined) return undefined;
		}
		return val;
	}
});

Array.prototype.sortBy = function (key, desc) {
	return this.sort(function(a, b) {
		let va = a.deepValue(key);
		let vb = b.deepValue(key);
		if (typeof va === "string") {
			va = va.toLowerCase();
		}
		if (typeof vb === "string") {
			vb = vb.toLowerCase();
		}
		if (desc) {
			return (va > vb) ? -1 : ((va < vb) ? 1 : 0);
		} else {
			return (va < vb) ? -1 : ((va > vb) ? 1 : 0);
		}
	});
};


// PART 2: Useful helper functions and services

function readCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for(let i=0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

const Unique = { // produce unique IDs
	n: 0,
	next: () => ++Unique.n,
	domID: () => '_' + Unique.next(),  // div IDs must not start with a number
};

class Event {
	constructor(name) {
		this.observers = [];
		if (name)  Event.index[name] = this;
	}
	subscribe(fn, ctx) { // *ctx* is what *this* will be inside *fn*.
		this.observers.push({fn, ctx});
	}
	unsubscribe(fn) {
		this.observers = this.observers.filter((x) => x !== fn);
	}
	broadcast() { // Accepts arguments.
		for (const o of this.observers)  o.fn.apply(o.ctx, arguments);
	}
}
Event.index = {}; // storage for all named events


// PART 3: widgets for Mithril and Bootstrap 4


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
		Object.assign(this, d);  // shallow copy
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
		const duration = len * Notification.speed;
		if (duration < Notification.min)  return Notification.min;
		else return duration;
	}
	view(vnode) {
		// Why "self" in view()? You'd expect *this* to refer to this instance,
		// but Mithril makes it an object whose prototype is this instance.
		const self = vnode.tag;
		return m('div.notification', [
			self.title ? m('h5', self.title) : null,
			self.html ? m.trust(self.html) : self.plain,
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
		const self = Notifier;
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
		const self = Notifier;
		window.clearTimeout(self.timeOut);
		self.index = self.index - (self.phase === 'off' ? 1 : 2);
		self.phase = 'starting';
		self.next();
	},
	addStatus: function (status) {
		const handle = Unique.next();
		this.statuses[handle] = status;
		m.redraw();
		return handle;
	},
	rmStatus: function (handle) {
		delete this.statuses[handle];
		m.redraw();
	},
	view: function () {
		const dis = ['off', 'starting'].contains(this.phase);
		var content, level;
		if (dis) { // display status
			var statstrings = Object.values(this.statuses);
			content = m('small', statstrings.length ?
				m(new UL(null, statstrings)) : 'Notifications');
			level = 'dark';
		} else { // display a message
			const cur = this.getCurrent();
			content = m(cur);
			level = cur.level;
		}
		const cls = ['starting', 'fading out'].contains(this.phase) ? '.fade-out' : '';
		const arr = [];
		if (!dis) {
			arr.push(m('button.btn.btn-secondary.btn-sm[title=Dismiss]', {onclick: Notifier.next}, '×'));
		}
		if (this.index > (dis ? -1 : 0)) {
			arr.push(m('button.btn.btn-secondary.btn-sm[title=Previous]', {onclick: Notifier.prev}, '<'));
		}
		arr.push(content);
		return m(`.notifier${cls}.alert.alert-${level}[role="alert"]`, arr);
	},
};


function request(d) {
	// Let user know a request is in progress and
	// set the 'X-XSRF-Token' request header.
	const notifier = d.pop('notifier') || Notifier;
	const handle = d.status ? notifier.addStatus(d.status) : null;
	d.withCredentials = true;
	d.headers = d.headers || {};
	d.headers['X-XSRF-Token'] = readCookie('XSRF-TOKEN');
	const promise = m.request(d);
	const ret = {then: function (callback) { this.callback = callback; }};
	promise.then(function (response) {
		if (handle)  notifier.rmStatus(handle);
		if (ret.callback) return ret.callback(response);
		return response;
	});
	promise.catch(function (e) {
		const msg = {level: 'danger'};
		if (e.error_title)  msg.title = e.error_title;
		if (e.error_msg)  msg.plain = e.error_msg;
		if (e.error_title || e.error_msg)  {
		} else if (typeof e === 'string') {
			msg.plain = e;
		} else {
			msg.title = 'Unexpected error';
			msg.plain = String(e);
		}
		notifier.add(msg);
		if (handle)  notifier.rmStatus(handle);
		if (e.redirect)  window.location = e.redirect;
	});
	return ret;
}


class SimpleTable {  // The *rows* argument should be an array of arrays
	constructor({headers=[], rows=[], classes='.table .table-bordered', caption=null}={}) {
		this.headers = headers;
		this.rows = rows;
		this.classes = classes;
		this.caption = caption;
	}
	view() {
		return m('table' + this.classes, [
			this.caption ? m('caption', this.caption) : null,
			m('thead', this.headers.map(h => m('th', h))),
			m('tbody', this.rows.map(r => m('tr',
				r.map(txt => m('td', txt))
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
		Object.assign(this, attrs);  // shallow copy
		this.formatter = this.formatter || {};
		this.sort();
	}
	sort() {
		this.rows = this.rows.sortBy(this.sortKey, this.desc);
	}
	view() {
		const arrow = this.desc ? ' ↘' : ' ↗';
		return m('table' + (this.classes || '.table .table-bordered .table-hover'), [
			this.caption ? m('caption[style="caption-side:top"]', this.caption) : null,
			m('thead[title="Click on a column header to sort"]', this.headers.map(h => m('th[style="cursor:pointer;"]',
				{
					onclick: (e) => this.headerClick(e, this),
					"data-key": h.key, "data-title": h.title,
				}, [
					h.title,
					(this.sortKey === h.key ? arrow : ''),
				]
			))),
			m('tbody', this.rows.map(o => m('tr',
				this.headers.map(h => m('td',
					this.formatter[h.key] ?
					this.formatter[h.key](o) :
					o[h.key]
				))
			)))
		]);
	}
	headerClick(e, self) {  // When user clicks on a table header, sort table
		const dat = e.target.dataset;
		const sortKey = dat.key;
		if (self.sortKey === sortKey) {
			self.desc = !self.desc;
		} else {
			self.sortKey = sortKey;
			self.desc = false;
		}
		self.sort();
		const displayDesc = self.desc ? ' (descending)' : '';
		Notifier.add({
			level: 'success',
			plain: `The table is now sorted by "${dat.title}"${displayDesc}.`,
		});
	}
}


class Select {
	constructor({groups=null, opts=null, css='', onChange=null}={}) {
		if (!groups && !opts || groups && opts)  throw new Error(
			"Pass either *groups* or *opts* to Select constructor.");
		this.groups = groups;
		this.opts = opts;
		this.css = css;
		this.changed = new Event();
		if (onChange)  this.changed.subscribe(onChange);
	}
	view(vnode) {
		// Why "self" in view()? You'd expect *this* to refer to this instance,
		// but Mithril makes it an object whose prototype is this instance.
		const self = vnode.tag;
		return m(
			"select" + self.css,
			{onchange: m.withAttr('value',
				v => self.changed.broadcast.apply(self.changed, [v]))},
			self.content.apply(self));
	}
	content() {
		if (this.groups) {
			return this.groups.map(
				(g) => m(
					'optgroup',
					{label: g.label},
					g.options.map(o => this.mkOption(o))));
		} else {
			return this.opts.map(o => this.mkOption(o));
		}
	}
	mkOption(opt) {
		return m(
			'option',
			{ // TODO Instead of this, just destructure *label*
				disabled: opt.disabled,
				selected: opt.selected ? 'selected' : undefined,
				title: opt.title || undefined,
				value: opt.value
			},
			opt.label);
	}
}


class MenuStrategy {
	constructor(entry) {
		this.entry = entry;
	}
}
class SelectNav extends MenuStrategy {
	view(vnode) {
		return m(
			"select", {
				onchange: m.withAttr('value', (url) => window.location = url),
				style: this.entry.style || 'margin-right:1rem;',
				title: this.entry.tooltip || undefined,
			},
			this.options(this.entry));
	}
	options(entry) {
		return [
			this.option(entry),
			m('optgroup', {label: "Navigate to:"},
				entry.children.map(c => this.option(c))),
		];
	}
	option(entry) {
		return m('option',
			{value: entry.url, title: entry.tooltip || undefined},
			entry.label);
	}
}
class DropdownNav extends MenuStrategy { // An individual drop down menu
	constructor(entry) { // *entry* is a model of the menu and its children
		super(entry);
		this.id = Unique.domID();
		this.dropId = 'drop' + this.id;
		this.drop = false;
		DropdownNav.instances.push(this);
		document.body.addEventListener(
			'click', () => this.clickOutsideMenu.apply(this));
	}
	view(vnode) {
		// Why "self" in view()? You'd expect *this* to refer to this instance,
		// but Mithril makes it an object whose prototype is this instance.
		const self = vnode.tag;
		return m("div.nav-item.dropdown",
			[
				m("a.nav-link.dropdown-toggle", {
					id: this.id,
					role: 'button',
					title: this.entry.tooltip || undefined,
					onclick: (e) => self.click.apply(self, [e]),
					}, [
						this.entry.icon ? m(`i.fas.fa-${this.entry.icon}`) : undefined,
						this.entry.label,
					]
				),
				m(".dropdown-menu" + (this.drop ? '.show': ''), {
					id: this.dropId,
					'aria-labelledby': this.id,
					},
					this.entry.children.map(
						(x) => m(
							"a.dropdown-item", {
								href: x.url,
								title: x.tooltip || undefined,
								onclick: (e) => self.click.apply(self, [e]),
							}, [
								x.icon ? m(`i.fas.fa-${x.icon}`) : undefined,
								x.label,
							]
						)
					)
				)
			]
		);
	}
	click(e) {
		if (!this.drop) { // If showing, first hide any shown menus
			for (const instance of DropdownNav.instances) {
				instance.drop = false;
			}
			this.drop = true;
		} else {
			this.drop = false;
		}
		e.cancelBubble = true; // do not run clickOutsideMenu()
	}
	clickOutsideMenu() { // Hide the dropdown when document body is clicked
		this.drop = false;
		m.redraw();
	}
}
DropdownNav.instances = [];

class NavMenu {
	constructor(att, strategy=SelectNav) {
		this.strategy = strategy;
		this.permanent = att.permanent || [];
		this.collapsable = att.collapsable;
		this.classes = att.classes || '';
		// ".navbar-expand-lg.navbar-dark.bg-dark"

		// Instantiate any sub-widgets once at construction time
		for (const section of [this.permanent, this.collapsable]) {
			if (!section)  continue;
			for (const entry of section) {
				if (entry.children && entry.children.length > 0) {
					entry.widget = new this.strategy(entry);
				}
			}
		}
	}
	renderMany(entries) {
		// return entries.map((x) => this.renderOne(x));
		const arr = [];
		for (const entry of entries) {
			arr.push(this.renderOne(entry));
		}
		return arr;
	}
	renderOne(entry) {          // TODO add .active
		if (entry.img){
			const attrs = Object.assign({  // shallow copy
				src: entry.img,
				alt: entry.alt,
				style: entry.style || 'margin-right:1rem;',
			}, entry.attrs);
			return m(
				"a.nav-link",
				{href: entry.url, title: entry.tooltip || undefined},
				m("img", attrs)
			);
		} else if (entry.children.length > 0) {
			return m(entry.widget);
		} else {
			return m(
				"a.nav-link",
				{href: entry.url, title: entry.tooltip || undefined},
				entry.label);
		}
	}
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
		let collapsNavs = this.collapsable ?
			this.renderToggler(this.renderMany(this.collapsable))
			: [];
		return m("nav.navbar" + this.classes,
			this.renderMany(this.permanent).concat(collapsNavs)
		);
	}
}


class SearchBox {
	// In order to observe this, set onchange: function (value) {...}
	constructor(attrs) {
		this.showNoResults = false;
		Object.assign(this, attrs);  // shallow copy
		this.inputAttrs = this.inputAttrs || {};
		this.inputAttrs.onkeyup = this.inputAttrs.onkeyup ||
			((e) => this.keyup.apply(this, [e]));
	}
	view(vnode) {
		// Why "self" in view()? You'd expect *this* to refer to this instance,
		// but Mithril makes it an object whose prototype is this instance.
		const self = vnode.tag;
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
		if (this.onchange)  this.onchange(this.value, this.ctx);
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


class FormField { // A bootstrap 4 form field, maybe with associated label
	constructor(label, input) {
		this.input = input;
		if (!input.id)  input.id = Unique.domID();
		this.label = label;
		this.labelAttrs = {for: input.id};
	}
	view(vnode) {
		// Why "self" in view()? You'd expect *this* to refer to this instance,
		// but Mithril makes it an object whose prototype is this instance.
		const self = vnode.tag;
		return m(".form-group", [
			self.label ?
				m("label", self.labelAttrs, self.label) : undefined,
			m(self.input),
		]);
	}
}


class PhoneField {
	// User code can use the event: `phonefield.changed.subscribe(fn);`
	constructor({value='', name='', placeholder='', css='', type='tel'}={}) {
		this.id = Unique.domID();
		this.css = css;
		this.attrs = {
			id: this.id,
			name: name ? name : undefined,
			onkeyup: m.withAttr('value', this.keyup, this),
			// pattern: /^[\d \+\-\(\)]{5,30}$/,
			placeholder: placeholder,
			type: type,
			value: value,
		};
		this.changed = new Event();
	}
	keyup(val) {
		this.attrs.value = val;
		this.changed.broadcast(val);
	}
	view(vnode) {
		// Why "self" in view()? You'd expect *this* to refer to this instance,
		// but Mithril makes it an object whose prototype is this instance.
		const self = vnode.tag;
		return m('input.phone.form-control' + (self.css || ''), self.attrs);
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
