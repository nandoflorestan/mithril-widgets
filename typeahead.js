'use strict';


class Typeahead {
	constructor({id, list}) {
		this.id = id;
		this._list = list;
	}

	// Return a filtered values list
	get list() {
		return this.filter(this._list);
	}

	showDropdown() {
		const dropdown = document.getElementById(`${this.id}-dropdown-menu`);
		dropdown.classList.add('show');
	}

	hideDropdown() {
		const dropdown = document.getElementById(`${this.id}-dropdown-menu`);
		dropdown.classList.remove('show');
	}

	dropdownList() {
		const list = [];

		for (const item of this.list) {
			list.push(m('a.dropdown-item', item));
		}

		return list;
	}

	filter(list)	{
		const input = document.getElementById(this.id);
		const searchTerm = String(input.value).toLowerCase().replace(/\s/g, '');
		const filteredList = list.filter(function (value) {
			const valueToTest = String(value).toLowerCase().replace(/\s/g, '');
			return valueToTest.indexOf(String(searchTerm)) > -1 ? true : false;
		});
		if (!filteredList.length) {
			this.hideDropdown();
		}
		return filteredList;
	}

	handleKeyUp(e) {
		this.showDropdown();
		switch (e.which) {
			case 40:
				e.preventDefault();
				break;

			case 38:
				e.preventDefault();
				break;

			case 13:
				e.preventDefault();
				break;

			case 27:
				e.preventDefault();
				this.hideDropdown();
				break;
		}
	}

	view(vnode) {
		const self = vnode.tag;
		return m('div.dropdown', [
				m('input.form-control', {
					onfocus: self.showDropdown,
					onclick: self.showDropdown,
					onblur: self.hideDropdown,
					onkeyup: self.handleKeyUp.bind(self),
					id: self.id,
					autocomplete: 'off',
					type: 'text'
				},
				''),
				m('div.dropdown-menu', {id: `${self.id}-dropdown-menu`}, self.dropdownList())
		]);
	}
}

export { Typeahead };
