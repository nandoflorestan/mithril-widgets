"use strict";

// A bootstrap 4 popover. *message* can be a Mithril component.
class Popover {  // jshint ignore:line
	constructor({elementId, title, message}) {
		this.showing = true;
		this.title = title;
		this.message = message;
		m.mount(document.getElementById(elementId), this);
	}

	toggle() {
		this.showing = !this.showing;
	}

	view(vnode) {
		const self = vnode.tag;
		return self.showing ? m(
			'.mw-popover',
			m('.card-deck.mw-popover-box',
				m('.card.mw-shadow', [
					m('.card-header.text-left.bg-info.text-white', self.title),
					m('.card-body.text-left', self.message)
				])
			)
		) : undefined;
	}
}
