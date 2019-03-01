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

	}

	open() {
		this.showing = true;
	}

	close() {
		this.showing = false;
	}

	// Dectect when user click outside
	onClickOutside(event) {
		let clickedElement = event.target;

		do {
			if (clickedElement.id === 'mw-popover-box') {
				// This is a click inside the popover, do nothing, just stop the function
				return false;
			} else {
				// If not, go up the DOM and check the next element
				clickedElement = clickedElement.parentNode;
			}
		} while (clickedElement);

		// This is an outside click
		this.close();
	}

	view() {
		return this.showing ? m('.mw-popover .mw-popover-backdrop', {onclick: this.onClickOutside.bind(this)},
			[m('.card-deck.mw-popover-container',
				[m('.card.mw-shadow', {id: 'mw-popover-box'}, [
					m('.card-header.text-left.bg-info.text-white', this._content.title),
					m('.card-body.text-left', this._content.view())
				])]
			)]
		) : undefined;
	}
}
