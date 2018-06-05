class Alert {
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
		return m('.card-deck.dv-alert',
					{style: self.showing ?
						'display:inline-block;' :
						'display:none;'
					},
					m('.card.nice-shadow',
					[
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
				);
	}
}
