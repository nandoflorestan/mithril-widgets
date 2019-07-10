"use strict";

// A bootstrap 4 popover. *content* can be a Mithril component such as:
//
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
		// Store a function with "this" bound to this instance
		this.onEscClose = this._onEscClose.bind(this);
	}

	_onEscClose(event) {
		if (event.key === "Escape") {
			this.close();
			m.redraw();
		}
	}

	open() {
		document.addEventListener('keyup', this.onEscClose, true);
		this.showing = true;
	}

	close() {
		document.removeEventListener('keyup', this.onEscClose, true);
		this.showing = false;
	}

	onClick(event) {
		let clickedElement = event.target;
		do {
			if (clickedElement.id === 'mw-popover-box') {
				// This is a click inside the popover, so do nothing
				return;
			} else {
				// If not, go up the DOM and check the next element
				clickedElement = clickedElement.parentNode;
			}
		} while (clickedElement);

		// This is an outside click, so close the popover
		this.close();
	}

	view() {
		return this.showing ? m('.mw-popover .mw-popover-backdrop', {onclick: this.onClick.bind(this)},
			[m('.mw-popover-container',
				[m('.card.mw-shadow', {id: 'mw-popover-box'}, [
					m('.card-header.text-left.bg-info.text-white', [
						m('strong', this._content.title),
						m('span.fas.fa-times-circle', {onclick: this.close.bind(this)}, '')
					]),
					m('.card-body.text-left', this._content.view())
				])]
			)]
		) : undefined;
	}
}

export { Popover }
