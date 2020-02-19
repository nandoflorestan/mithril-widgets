'use strict';

// A basic typeahed using bootstrap 4 dropdown
class Typeahead {
	constructor({id, list, position}) {
		this.position = position || 'dropdown';
		this.id = id;
		// Holds the full list of suggestions
		this._list = list;
		// Helper to select the items on list
		this._currentItemIndex = null;
		document.body.addEventListener('click', (event) => this.clickOutside.apply(this, [event]));
	}

	// Return a filtered list of suggestions
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
		// Get the dropdown element
		const dropdown = document.getElementById(`${this.id}-dropdown-menu`);
		dropdown.classList.add('show');
	}

	hideDropdown() {
		this.clearActiveItems();
		const dropdown = document.getElementById(`${this.id}-dropdown-menu`);
		if (dropdown) {
			dropdown.classList.remove('show');
			this._activateItem();
		}
	}

	// Creates the dropdown suggestions list with the this.list values
	createDropdownList() {
		const list = [];

		let index = 0;
		for (const item of this.list) {
			list.push(m('a.dropdown-item', {onclick: this.selectItem.bind(this), ["data-index"]: index}, item));
			index = index + 1;
		}

		return list;
	}

	// Return a list with suggestions filtered by the current value in the typeahead input
	// This is case insentive, ignore spaces and make the search in any position of the string
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

	// When user press "down arrow" key, find the new _currentItemIndex
	// and add the css class "active" to the correct item on dropmenu
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

	// When user press "up arrow" key, find the new _currentItemIndex
	// and add the css class "active" to the correct item on dropmenu
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

	// Add the css class "active" to dropdown-item with index iqual to this._currentItemIndex
	// and remove any "active" class from other dropdown-item
	_activateItem() {
		if (this._currentItemIndex === null) {
			this._currentItemIndex = 0;
		}
		const dropdown = document.getElementById(`${this.id}-dropdown-menu`);
		if (dropdown) {
			const dropdownItems = dropdown.children;
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
	}

	// Remove any "active" css class from dropdown-items
	clearActiveItems() {
		this._currentItemIndex = null;
		this._activateItem();
	}

	// Select the value in this.list[index] and put on typeahead input
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

	// Hide the dropdown if user click outside from typeahead input
	clickOutside(event) {
		// Cancel if the targe is the typeahead input
		if (event.target.id === this.id) {
			return;
		}
		this.hideDropdown();
	}

	// Allow to select an item using the keyboard
	handleKeyUp(e) {
		this.showDropdown();
		switch (e.which) {
			// Arrow down
			case 40:
				e.preventDefault();
				this.activateNextItem();
				break;
			// Arrow up
			case 38:
				e.preventDefault();
				this.activatePreviousItem();
				break;
			// Enter
			case 13:
				e.preventDefault();
				this.selectItem();
				break;
			// ESC
			case 27:
				e.preventDefault();
				this.hideDropdown();
				break;
			// Any other key
			default:
				this._currentItemIndex = 0;
				this._activateItem();
		}
	}

	view(vnode) {
		const self = vnode.tag;
		return m(`div.${self.position}`, [
				m('input.form-control', {
					onfocus: self.showDropdown.bind(self),
					onclick: self.showDropdown.bind(self),
					onkeyup: self.handleKeyUp.bind(self),
					id: self.id,
					autocomplete: 'off',
					type: 'text'
				},
				''),
				m('div.dropdown-menu', {id: `${self.id}-dropdown-menu`}, self.createDropdownList())
		]);
	}
}

export { Typeahead };
