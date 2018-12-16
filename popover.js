"use strict";

// A bootstrap 4 popover. *message* can be a Mithril component.
class Popover {  // jshint ignore:line
	constructor() {
		this.showing = false;
	}

	message({title, message}) {
		this.message = message;
		this.title = title;
		this.toggle();
	}

	toggle() {
		this.showing = !this.showing;
	}

	view(vnode) {
		const self = vnode.tag;
		return self.showing ? m(
			'.mw-popover',
			[m('.card-deck.mw-popover-box',
				[m('.card.mw-shadow', [
					m('.card-header.text-left.bg-info.text-white', self.title),
					m('.card-body.text-left', [self.message])
				])]
			)]
		) : undefined;
	}
}
