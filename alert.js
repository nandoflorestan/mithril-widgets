class Alert {
	constructor() {
		this.showing = false;
	}

	show(title, message) {
		this.showing = true;
		this.title = title;
		this.message = message;
	}

	hide() {
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
									onclick: () => self.hide(),
									style: 'min-width: 5em; margin: 1em;',
								},
								' Ok'
							)
						)
					])
				);
	}
}
