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
		// Register the function to bind the "this" and keep the same signature, this allow remove the listener
		this._closeOnPressEsc = this.closeOnPressEsc.bind(this);
		document.addEventListener('keyup', this._closeOnPressEsc, true);
	}

	closeOnPressEsc(event) {
		console.log('event', event);
		console.log('this', this);
		if (event.key === "Escape") {
			this.close();
			m.redraw();
		}
	}

	open() {
		this.showing = true;
	}

	close() {
		document.removeEventListener('keyup', this._closeOnPressEsc, true);
		this.showing = false;
	}

	onClick(event) {
		let clickedElement = event.target;
		do {
			if (clickedElement.id === 'mw-popover-box') {
				// This is a click inside the popover, so do nothing
				return false;
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
