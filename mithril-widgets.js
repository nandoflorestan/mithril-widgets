/** @prettier */
"use strict";

import m from "/web_modules/mithril/mithril.js";

// Useful helper functions and services
// ====================================

function readCookie(name) {
	const nameEQ = name + "=";
	const ca = document.cookie.split(";");
	for (let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) === " ") c = c.substring(1, c.length);
		if (c.indexOf(nameEQ) === 0)
			return c.substring(nameEQ.length, c.length);
	}
	return null;
}

const Unique = {
	// produce unique IDs
	n: 0,
	next: () => ++Unique.n,
	domID: () => "_" + Unique.next(), // div IDs must not start with a number
};

class _TinyEvent {
	/* Use this when you want events without DOM elements. */

	constructor(name) {
		if (name) _TinyEvent._index.set(name, this);
		this._triggerLate = false;
		this.clear();
	}
	clear() {
		this.triggeredCount = 0;
		this._observers = [];
	}
	pleaseTriggerOnLateSubscribe() {
		this._triggerLate = true;
		return this;
	}
	subscribe(fn, ctx) {
		// *ctx* is what *this* will be inside *fn*.
		this._observers.push({fn, ctx});
		// Sometimes we run fn immediately if the event was already triggered
		if (this._triggerLate && this.triggeredCount > 0)
			fn.apply(ctx, arguments);
		return fn;
	}
	unsubscribe(fn, ctx) {
		const initialLen = this._observers.length;
		this._observers = this._observers.filter(
			(x) => x.fn !== fn || x.ctx !== ctx
		);
		if (this._observers.length === initialLen)
			console.warn(`Function was not subscribed: ${fn}`);
	}
	broadcast() {
		// Dispatch this event. Accepts arguments.
		this.triggeredCount++;
		for (const o of this._observers) {
			o.fn.apply(o.ctx, arguments);
		}
	}
	static byName(name) {
		const event = _TinyEvent._index.get(name);
		if (event == null) throw new Error(`Event not registered: "${name}"`);
		return event;
	}
}
_TinyEvent._index = Object.seal(new Map()); // storage for all named events

/*export*/ function TinyEvent(name) {
	return Object.seal(new _TinyEvent(name));
}
TinyEvent.byName = _TinyEvent.byName;

// Widgets for Mithril and Bootstrap 4
// ===================================

class UL {
	// Unordered list
	constructor(attrs, items) {
		this.attrs = attrs;
		this.items = items;
	}
	view() {
		return m(
			"ul",
			this.attrs,
			this.items.map((i) => m("li", i))
		);
	}
}

class Notification {
	constructor(d) {
		Object.assign(this, d); // shallow copy
		if (!this.level) this.level = "warning";
		if (Notification.levels.indexOf(this.level) === -1) {
			console.error("Message with wrong level:", this);
			this.icon = Notification.icons.info;
		} else {
			this.icon = Notification.icons[this.level];
		}
	}
	get readingTime() {
		// Estimate the time one takes to read some text
		let len = 0;
		if (this.title) len += this.title.length;
		if (this.html) len += this.html.length;
		if (this.plain) len += this.plain.length;
		const duration = len * Notification.speed;
		if (duration < Notification.min) return Notification.min;
		else return duration;
	}
	view(vnode) {
		// Why "self" in view()? You'd expect *this* to refer to this instance,
		// but Mithril makes it an object whose prototype is this instance.
		const self = vnode.tag;
		return m("div.notification", [
			self.title
				? m("h5", [
						m(`span.fas.fa-${self.icon}`),
						m("span", self.title),
				  ])
				: null,
			self.html ? m.trust(self.html) : m("div", self.plain),
		]);
	}
}
// Bootstrap also has 'secondary', 'light' and 'dark', but these are not considered useful graveness levels.
Notification.levels = ["success", "info", "warning", "danger"]; // mind the order!
Notification.icons = {
	success: "check-circle",
	info: "info-circle",
	warning: "exclamation",
	danger: "exclamation-circle",
};
Notification.speed = 90; // Takes one second to read 11 chars
Notification.min = 3000; // but the minimum is 3 seconds
var Notifier = {
	// A position:fixed component to display toasts
	history: [],
	index: -1,
	phase: "off", // off, starting, on, fading out
	timeOut: -1,
	statuses: {},
	getCurrent: function() {
		if (this.index === -1) return null;
		return this.history[this.index];
	},
	add: function(o) {
		this.history.push(new Notification(o));
		if (this.phase === "off") {
			this.next();
		}
	},
	next: function() {
		const self = Notifier;
		window.clearTimeout(self.timeOut); // in case button pressed

		if (self.phase === "off") {
			self.phase = "starting"; // fade out the main msg
			self.timeOut = window.setTimeout(self.next, 200);
		} else if (["starting", "fading out"].contains(self.phase)) {
			self.phase = "on"; // show current msg
			++self.index;
			self.timeOut = window.setTimeout(
				self.next,
				self.getCurrent().readingTime
			);
		} else if (self.phase === "on") {
			// Turn self off or fade out for next message
			if (self.index === self.history.length - 1) {
				self.phase = "off";
			} else {
				self.phase = "fading out";
				self.timeOut = window.setTimeout(self.next, 200);
			}
		} else {
			throw new Error("Notifier phase could not be cycled.");
		}
		m.redraw();
	},
	prev: function() {
		// prev button was pressed
		const self = Notifier;
		window.clearTimeout(self.timeOut);
		self.index = self.index - (self.phase === "off" ? 1 : 2);
		self.phase = "starting";
		self.next();
	},
	addStatus: function(status) {
		const handle = Unique.next();
		this.statuses[handle] = status;
		m.redraw();
		return handle;
	},
	rmStatus: function(handle) {
		delete this.statuses[handle];
		m.redraw();
	},
	view: function() {
		const dis = ["off", "starting"].contains(this.phase);
		var content, level;
		if (dis) {
			// display status
			var statstrings = Object.values(this.statuses);
			content = m(
				"small",
				statstrings.length
					? m(new UL(null, statstrings))
					: [m("span.fas.fa-bell"), " Notifications"]
			);
			level = "dark";
		} else {
			// display a message
			const cur = this.getCurrent();
			content = m(cur);
			level = cur.level;
		}
		const cls = ["starting", "fading out"].contains(this.phase)
			? ".fade-out"
			: "";
		const arr = [];
		const buttons = [];
		if (this.index > (dis ? -1 : 0)) {
			buttons.push(
				m(
					"button.btn.btn-secondary.btn-sm[title=Previous]",
					{onclick: Notifier.prev},
					"<"
				)
			);
		}
		if (!dis) {
			buttons.push(
				m(
					"button.btn.btn-secondary.btn-sm[title=Dismiss]",
					{onclick: Notifier.next},
					"×"
				)
			);
		}
		arr.push(content);
		return m(`.flex.notifier${cls}.alert.alert-${level}[role="alert"]`, [
			arr,
			buttons.length ? m(".text-nowrap", buttons) : null,
		]);
	},
};

function request(d) {
	// Let user know a request is in progress and
	// set the 'X-XSRF-Token' request header.
	const notifier = d.pop("notifier") || Notifier;
	const handle = d.status ? notifier.addStatus(d.status) : null;
	d.withCredentials = true;
	d.headers = d.headers || {};
	d.headers["X-XSRF-Token"] = readCookie("XSRF-TOKEN");
	d.headers.Accept = d.headers.Accept || "application/json";
	const ret = {
		then: function(callback) {
			this.callback = callback;
			return this;
		},
		catch: function(errorCallback) {
			this.errorCallback = errorCallback;
			return this;
		},
	};
	m.request(d)
		.then(function(response) {
			if (
				response.commands &&
				response.commands.length &&
				window.serverCommands
			) {
				window.serverCommands.runAll(response.commands);
			}
			if (response.toasts) {
				// for kerno-like return values
				for (const obj of response.toasts) {
					notifier.add(obj);
				}
			}
			if (handle) notifier.rmStatus(handle);
			if (ret.callback) {
				return ret.callback(response);
			}
			return response;
		})
		.catch(function(e) {
			if (e.toasts) {
				// for kerno-like return values
				for (const obj of e.toasts) {
					notifier.add(obj);
				}
			} else {
				// for bag-like return values
				const msg = {level: "danger"};
				if (e.error_title) msg.title = e.error_title;
				if (e.error_msg) msg.plain = e.error_msg;
				if (e.error_title || e.error_msg) {
				} else if (typeof e === "string") {
					// for returned strings
					msg.plain = e;
				} else {
					// for obscure return values
					msg.title = "Error communicating with server";
					msg.plain = String(e);
				}
				notifier.add(msg);
				console.error(e);
			}
			if (handle) notifier.rmStatus(handle);
			if (e.redirect) window.location = e.redirect;
			if (ret.errorCallback) {
				return ret.errorCallback(e);
			}
		});
	return ret;
}

class SimpleTable {
	// The *rows* argument should be an array of arrays
	constructor({
		headers = [],
		rows = [],
		classes = ".table .table-bordered",
		caption = null,
	} = {}) {
		this.headers = headers;
		this.rows = rows;
		this.classes = classes;
		this.caption = caption;
	}
	view() {
		return m("table" + this.classes, [
			this.caption ? m("caption", this.caption) : null,
			m(
				"thead",
				this.headers.map((h) => m("th", h))
			),
			m(
				"tbody",
				this.rows.map((r) =>
					m(
						"tr",
						r.map((txt) => m("td", txt))
					)
				)
			),
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
		Object.assign(this, attrs); // shallow copy
		this.formatter = this.formatter || {};
		this.sort();
	}
	sort() {
		this.rows = this.rows.sortBy(this.sortKey, this.desc);
	}
	view() {
		const arrow = this.desc ? " ↘" : " ↗";
		return m(
			"table" + (this.classes || ".table .table-bordered .table-hover"),
			[
				this.caption
					? m('caption[style="caption-side:top"]', this.caption)
					: null,
				m(
					'thead[title="Click on a column header to sort"]',
					this.headers.map((h) =>
						m(
							'th[style="cursor:pointer;"]',
							{
								onclick: (e) => this.headerClick(e, this),
								"data-key": h.key,
								"data-title": h.title,
							},
							[h.title, this.sortKey === h.key ? arrow : ""]
						)
					)
				),
				m(
					"tbody",
					this.rows.map((o) =>
						m(
							"tr",
							this.headers.map((h) =>
								m(
									"td",
									this.formatter[h.key]
										? this.formatter[h.key](o)
										: o[h.key]
								)
							)
						)
					)
				),
			]
		);
	}
	headerClick(e, self) {
		// When user clicks on a table header, sort table
		const dat = e.target.dataset;
		const sortKey = dat.key;
		if (self.sortKey === sortKey) {
			self.desc = !self.desc;
		} else {
			self.sortKey = sortKey;
			self.desc = false;
		}
		self.sort();
		const displayDesc = self.desc ? " (descending)" : "";
		Notifier.add({
			level: "success",
			plain: `The table is now sorted by "${dat.title}"${displayDesc}.`,
		});
	}
}

class Select {
	constructor({groups = null, opts = null, css = "", onChange = null} = {}) {
		if ((!groups && !opts) || (groups && opts))
			throw new Error(
				"Pass either *groups* or *opts* to Select constructor."
			);
		this.groups = groups;
		this.opts = opts;
		this.css = css;
		this.changed = TinyEvent();
		if (onChange) this.changed.subscribe(onChange);
	}
	view(vnode) {
		// Why "self" in view()? You'd expect *this* to refer to this instance,
		// but Mithril makes it an object whose prototype is this instance.
		const self = vnode.tag;
		return m(
			"select" + self.css,
			{
				onchange: m.withAttr("value", (v) =>
					self.changed.broadcast.apply(self.changed, [v])
				),
			},
			self.content.apply(self)
		);
	}
	content() {
		if (this.groups) {
			return this.groups.map((g) =>
				m(
					"optgroup",
					{label: g.label},
					g.options.map((o) => this.mkOption(o))
				)
			);
		} else {
			return this.opts.map((o) => this.mkOption(o));
		}
	}
	mkOption(opt) {
		return m(
			"option",
			{
				// TODO Instead of this, just destructure *label*
				disabled: opt.disabled,
				selected: opt.selected ? "selected" : undefined,
				title: opt.title || undefined,
				value: opt.value,
			},
			opt.label
		);
	}
}

class MenuStrategy {
	constructor(entry) {
		this.entry = entry;
	}
}
class SelectNav extends MenuStrategy {
	view() {
		return m(
			"select",
			{
				onchange: m.withAttr("value", (url) => (window.location = url)),
				style: this.entry.style || "margin-right:1rem;",
				title: this.entry.tooltip || undefined,
			},
			this.options(this.entry)
		);
	}
	options(entry) {
		return [
			this.option(entry),
			m(
				"optgroup",
				{label: "Navigate to:"},
				entry.children.map((c) => this.option(c))
			),
		];
	}
	option(entry) {
		return m(
			"option",
			{value: entry.url, title: entry.tooltip || undefined},
			entry.label
		);
	}
}
class DropdownNav extends MenuStrategy {
	// An individual drop down menu
	constructor(entry, bootstrap = 4) {
		// *entry* is a model of the menu and its children
		super(entry);
		this.id = Unique.domID();
		this.dropId = "drop" + this.id;
		this.drop = false;
		this.bootstrap = bootstrap;
		DropdownNav.instances.push(this);
		document.body.addEventListener("click", () =>
			this.clickOutsideMenu.apply(this)
		);
		for (const nav of this.entry.children) {
			if (nav.click_event_name) {
				nav.click = TinyEvent(nav.click_event_name);
			}
		}
	}
	view(vnode) {
		// Why "self" in view()? You'd expect *this* to refer to this instance,
		// but Mithril makes it an object whose prototype is this instance.
		const self = vnode.tag;
		return m("li.nav-item.dropdown" + (this.drop ? ".active" : ""), [
			m(
				"a.nav-link.dropdown-toggle",
				{
					id: this.id,
					role: "button",
					title: this.entry.tooltip || undefined,
					onclick: (e) => self.click.apply(self, [e]),
				},
				[
					this.entry.icon
						? m(`i.fas.fa-${this.entry.icon}`)
						: undefined,
					this.entry.label,
				]
			),
			m(
				".dropdown-menu" + (this.drop ? ".show" : ""),
				{
					id: this.dropId,
					"aria-labelledby": this.id,
				},
				this.entry.children.map(function(child) {
					let childAttrs = {
						title: child.tooltip || undefined,
					};
					if (child.click) {
						childAttrs.onclick = function(e) {
							self.click.apply(self, [e]);
							child.click.broadcast(e, child);
						};
					}
					if (child.url) childAttrs.href = child.url;

					return m("a.dropdown-item", childAttrs, [
						child.icon ? m(`i.fas.fa-${child.icon}`) : undefined,
						child.label,
					]);
				})
			),
		]);
	}
	click(e) {
		if (!this.drop) {
			// If showing, first hide any shown menus
			for (const instance of DropdownNav.instances) {
				instance.drop = false;
			}
			this.drop = true;
		} else {
			this.drop = false;
		}
		e.cancelBubble = true; // do not run clickOutsideMenu()
	}
	clickOutsideMenu() {
		// Hide the dropdown when document body is clicked
		this.drop = false;
		m.redraw();
	}
}
DropdownNav.instances = [];

class NavMenu {
	constructor(att, strategy = SelectNav, bootstrap = 4) {
		this.strategy = strategy;
		this.permanent = att.permanent || [];
		this.collapsable = att.collapsable;
		this.classes = att.classes || "";
		this.bootstrap = bootstrap;
		this.burgerMenuShow = false;
		this.burgerMenuClick = TinyEvent();
		this.burgerMenuClick.subscribe(this.toggleBurgerMenu);
		// ".navbar-expand-lg.navbar-dark.bg-dark"

		// Instantiate any sub-widgets once at construction time
		for (const section of [this.permanent, this.collapsable]) {
			if (!section) continue;
			for (const entry of section) {
				if (entry.children && entry.children.length > 0) {
					entry.widget = new this.strategy(entry, this.bootstrap);
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
	renderOne(entry) {
		// TODO add .active
		if (entry.img) {
			const attrs = Object.assign(
				{
					// shallow copy
					src: entry.img,
					alt: entry.alt,
					style: entry.style || "margin-right:1rem;",
				},
				entry.attrs
			);
			return m(
				"li",
				m(
					"a" + this.getMenuItemClasses(),
					{href: entry.url, title: entry.tooltip || undefined},
					m("img", attrs)
				)
			);
		} else if (entry.children.length > 0) {
			return m(entry.widget);
		} else {
			return m(
				"a" + this.getMenuItemClasses(),
				{href: entry.url, title: entry.tooltip || undefined},
				entry.label
			);
		}
	}
	renderToggler(contents) {
		const self = this;
		return [
			m(
				".navbar-header",
				{
					onclick: function() {
						self.burgerMenuClick.broadcast(self);
					},
				},
				m(
					`button.navbar-toggler.navbar-toggle.collapsed[aria-controls='navbarSupportedContent'][aria-expanded='${this.burgerMenuShow}'][aria-label='Toggle navigation'][data-target='#navbarSupportedContent'][data-toggle='collapse'][type='button']`,
					this.getHamburgerIcon()
				)
			),
			m(
				".collapse.navbar-collapse[id='navbarSupportedContent']",
				{
					class: this.burgerMenuShow ? "show" : undefined,
				},
				m("ul.nav.navbar-nav.mr-auto", contents)
			),
		];
	}
	toggleBurgerMenu(self) {
		self.burgerMenuShow = !self.burgerMenuShow;
	}
	getHamburgerIcon() {
		if (this.bootstrap === 4) return m("span.navbar-toggler-icon");
		else
			return [m("span.icon-bar"), m("span.icon-bar"), m("span.icon-bar")];
	}
	getMainMenuClasses() {
		if (this.bootstrap === 4)
			return ".navbar.navbar-expand-lg navbar-dark bg-fair";
		else return ".navbar.navbar-inverse";
	}
	getMenuItemClasses() {
		if (this.bootstrap === 4) return ".nav-link";
		else return ".dropdown-toggle";
	}
	view() {
		// let collapsNavs = this.collapsable ?
		// 	this.renderToggler(this.renderMany(this.collapsable))
		// 	: [];
		// return m("nav." + this.getMainMenuClasses() + this.classes,
		// 	m('ul.navbar-nav.mr-auto.nav', this.renderMany(this.permanent).concat(collapsNavs))
		// );
		return m(
			"nav." + this.getMainMenuClasses() + this.classes,
			m("div", this.renderToggler(this.renderMany(this.permanent)))
		);
	}
}

class SearchBox {
	// User code can use the event: `searchBox.changed.subscribe(fn);`
	constructor(attrs) {
		this.showNoResults = false;
		Object.assign(this, attrs); // shallow copy
		this.inputAttrs = this.inputAttrs || {};
		this.inputAttrs.onkeyup =
			this.inputAttrs.onkeyup || ((e) => this.keyup.apply(this, [e]));
		this.changed = TinyEvent();
	}
	view(vnode) {
		// Why "self" in view()? You'd expect *this* to refer to this instance,
		// but Mithril makes it an object whose prototype is this instance.
		const self = vnode.tag;
		return m(".searchbox", [
			m(".input-group", [
				m(
					"input.form-control.search[type=text][placeholder=Press Enter to search][aria-label=Search]",
					self.inputAttrs
				),
				m(
					".input-group-append",
					m(
						"button.btn.btn-outline-secondary[type=button][title=Clear search]",
						{onclick: (e) => self.clear.apply(self, [e])},
						"×"
					)
				),
			]),
			self.showNoResults
				? m(".no-results", "This search yields no results.")
				: null,
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
		this.changed.broadcast(this.value);
	}
	clear(e) {
		const input = e.target.parentNode.previousSibling;
		input.value = "";
		input.focus();
		this.setValue("");
	}
	hadNoResults() {
		this.showNoResults = true;
	}
}

// A bootstrap 4 form field, maybe with associated label
class FormField {
	constructor(label, input) {
		this.input = input;
		if (!input.id) input.id = Unique.domID();
		this.label = label;
		this.labelAttrs = {for: input.id};
	}
	view(vnode) {
		// Why "self" in view()? You'd expect *this* to refer to this instance,
		// but Mithril makes it an object whose prototype is this instance.
		const self = vnode.tag;
		return m(".form-group", [
			self.label ? m("label", self.labelAttrs, self.label) : undefined,
			m(self.input),
		]);
	}
}

class PhoneField {
	// User code can use the event: `phonefield.changed.subscribe(fn);`
	constructor({
		value = "",
		name = "",
		placeholder = "",
		css = "",
		type = "tel",
	} = {}) {
		this.id = Unique.domID();
		this.css = css;
		this.attrs = {
			id: this.id,
			name: name ? name : undefined,
			onkeyup: m.withAttr("value", this.keyup, this),
			// pattern: /^[\d \+\-\(\)]{5,30}$/,
			placeholder: placeholder,
			type: type,
			value: value,
		};
		this.changed = TinyEvent();
	}
	keyup(val) {
		this.attrs.value = val;
		this.changed.broadcast(val);
	}
	view(vnode) {
		// Why "self" in view()? You'd expect *this* to refer to this instance,
		// but Mithril makes it an object whose prototype is this instance.
		const self = vnode.tag;
		return m("input.phone.form-control" + (self.css || ""), self.attrs);
	}
}

class ContentEditable {
	// TODO Observer in order to POST edited content
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
		return m(
			"div",
			{
				contenteditable: true,
				onchange: m.withAttr("innerText", (t) => (this.text = t)),
			},
			m.trust(this.text)
		);
	}
}

class ServerCommands {
	constructor(context) {
		this.context = context;
		this.commands = {};
	}

	add(commandName, command) {
		this.commands[commandName] = command;
	}

	run(command) {
		this.commands[command.name](this.context, command);
	}

	runAll(commands) {
		for (const command of commands) {
			this.run(command);
		}
	}
}

export {
	Unique,
	TinyEvent,
	UL,
	Notification,
	request,
	SimpleTable,
	SortedTable,
	Select,
	MenuStrategy,
	Notifier,
	SelectNav,
	DropdownNav,
	NavMenu,
	SearchBox,
	FormField,
	PhoneField,
	ContentEditable,
	ServerCommands,
};
