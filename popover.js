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

	toggle() {
		this.showing = !this.showing;

		if (this.showing) {
			// Add the listener to capture when click outside
			// First add it to this._ifClickOutside so the function have the same signature when remove the listner
			this._ifClickOutside = this.ifClickOutside.bind(this);
			// SetTimeout prevents the first click from being captured if the toggle is called by the click of a button
			setTimeout(()=> document.addEventListener("click", this._ifClickOutside));
		} else {
			// Remove the listener on close
			document.removeEventListener("click", this._ifClickOutside);
		}
	}

	ifClickOutside(event) {
		const targetElement = document.getElementById('mw-popover-box');
		let clickedElement = event.target;

		do {
			if (clickedElement === targetElement) {
				// This is a click inside the popover, do nothing, just return
				return false;
			}
			// Go up the DOM
			clickedElement = clickedElement.parentNode;
		} while (clickedElement);

		// This is an outside click
		this.toggle();
	}

	view() {
		return this.showing ? m(
			'.mw-popover',
			[m('.card-deck.mw-popover-container',
				[m('.card.mw-shadow', {id: 'mw-popover-box'}, [
					m('.card-header.text-left.bg-info.text-white', this._content.title),
					m('.card-body.text-left', this._content.view())
				])]
			)]
		) : undefined;
	}
}
