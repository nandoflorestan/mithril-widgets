'use strict';


class Typeahead {
	constructor({id, list}) {
		this.id = id;
		this._list = list;
		// Helper to select the items on list
		this._currentItemIndex = null;
	}

	// Return a filtered values list
	get list() {
		return this.filter(this._list);
	}

	showDropdown() {
		// Only show the dropdown if user type some value
		const input = document.getElementById(this.id);
		if (!input.value.replace(/\s/g, '').length) {
			this.hideDropdown();
			return;
		}

		const dropdown = document.getElementById(`${this.id}-dropdown-menu`);
		dropdown.classList.add('show');
	}

	hideDropdown() {
		this.clearActiveItems();
		const dropdown = document.getElementById(`${this.id}-dropdown-menu`);
		dropdown.classList.remove('show');
	}

	dropdownList() {
		const list = [];

		let index = 0;
		for (const item of this.list) {
			list.push(m('a.dropdown-item', {onclick: this.selectItem.bind(this), ["data-index"]: index}, item));
			index = index + 1;
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

	activateNextItem() {
		if (!this.list.length) {
			return;
		}

		if (this._currentItemIndex === null) {
			this._currentItemIndex = 0;
		} else if (this._currentItemIndex < this.list.length - 1) {
			this._currentItemIndex = this._currentItemIndex + 1;
		} else {
			this._currentItemIndex = 0;
		}

		this._activateItem();
	}

	activatePreviousItem() {
		if (!this.list.length) {
			return;
		}

		if (this._currentItemIndex === null) {
			this._currentItemIndex = 0;
		} else if (this._currentItemIndex >= 1) {
			this._currentItemIndex = this._currentItemIndex - 1;
		} else {
			this._currentItemIndex = this.list.length - 1;
		}

		this._activateItem();
	}

	_activateItem() {
		const dropdownItems = document.getElementById(`${this.id}-dropdown-menu`).children;
		let index = 0;
		for (const item of dropdownItems) {
			if (index === this._currentItemIndex) {
				item.classList.add('active');
			} else {
				item.classList.remove('active');
			}

			index = index + 1;
		}
	}

	clearActiveItems() {
		this._currentItemIndex = null;
		this._activateItem();
	}

	selectItem(event) {
		// If called by onclick event
		if (event && event.target) {
			this._currentItemIndex = parseInt(event.target.dataset.index);
		}
		// Select item from this.list and put it as the typeahead input value
		const currentItem = this.list[this._currentItemIndex];
		const input = document.getElementById(this.id);
		input.value = currentItem;
		this.hideDropdown();
	}

	handleKeyUp(e) {
		this.showDropdown();

		switch (e.which) {
			case 40:
				e.preventDefault();
				this.activateNextItem();
				break;

			case 38:
				e.preventDefault();
				this.activatePreviousItem()
				break;

			case 13:
				e.preventDefault();
				this.selectItem();
				break;

			case 27:
				e.preventDefault();
				this.hideDropdown();
				break;

			default:
				this._currentItemIndex = 0;
				this._activateItem();
		}
	}

	view(vnode) {
		const self = vnode.tag;
		return m('div.dropdown', [
				m('input.form-control', {
					onfocus: self.showDropdown.bind(self),
					onclick: self.showDropdown.bind(self),
					// onblur: self.hideDropdown,
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
