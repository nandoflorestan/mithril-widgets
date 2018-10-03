"use strict";

// A bootstrap 4 popover. *message* can be a Mithril component.
class Alert {  // jshint ignore:line
	constructor({elementId, title, message}) {
		this.showing = true;
		this.title = title;
		this.message = message;
		m.mount(document.getElementById(elementId), this);
	}

	close() {
		this.showing = false;
	}

	view(vnode) {
		const self = vnode.tag;
		return m(
			'.mw-alert',
			m('.card-deck.mw-alert-box',
				{style: self.showing ?
					'display:inline-block;' :
					'display:none;'
				},
				m('.card.mw-shadow', [
					m('.card-header.text-left.bg-info.text-white', self.title),
					m('.card-body.text-left', self.message),
					m('div.text-center',
						m('button.btn.btn-primary.btn-sm',
							{
								onclick: () => self.close(),
								style: 'min-width: 5em; margin: 1em;',
							},
							' Ok'
						)
					)
				])
			)
		);
	}
}
