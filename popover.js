"use strict";

// A bootstrap 4 popover. *message* can be a Mithril component.
class _Popover {  // jshint ignore:line
	constructor() {
		this.showing = true;
	}

	oninit(vnode) {
		// Add this _popover to user class
		vnode.attrs.ctx._popover = vnode.state;
	}

	toggle() {
		this.showing = !this.showing;
	}

	view(vnode) {
		return this.showing ? m(
			'.mw-popover',
			[m('.card-deck.mw-popover-box',
				[m('.card.mw-shadow', [
					m('.card-header.text-left.bg-info.text-white', [vnode.attrs.title]),
					m('.card-body.text-left', [vnode.attrs.message])
				])]
			)]
		) : undefined;
	}
}
