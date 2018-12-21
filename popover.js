"use strict";

// A bootstrap 4 popover. *content* can be a Mithril component.
//	class PopoverContent {
//		set popover(popover) {
//			this._popover = popover;
//		}
//		get title()   { return string or mithril nodes. }
//		view() { return string or mithril nodes. }
//	}
class Popover {  // jshint ignore:line
	constructor(content) {
		this._content = content;
		content.popover = this;
		this.showing = false;
	}

	toggle() {
		this.showing = !this.showing;
	}

	view(vnode) {
		return this.showing ? m(
			'.mw-popover',
			[m('.card-deck.mw-popover-box',
				[m('.card.mw-shadow', [
					m('.card-header.text-left.bg-info.text-white', this._content.title),
					m('.card-body.text-left', this._content.view())
				])]
			)]
		) : undefined;
	}
}
