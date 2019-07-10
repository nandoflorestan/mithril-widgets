// PART 1: add a couple useful methods to js data types.

Object.defineProperty(Object.prototype, 'pop', {
	writable: false,
	configurable: false,
	enumerable: false,
	value: function (key) {  // Return the value and remove *key* from this
		var value = this[key];
		delete this[key];
		return value;
	}
});

if (!Array.prototype.contains) {
	Object.defineProperty(Array.prototype, 'contains', {value: function (o) {
		return this.indexOf(o) != -1;
	}});
}

Object.defineProperty(Object.prototype, 'deepValue', {
	writable: false,
	configurable: false,
	enumerable: false,
	value: function (key) { // Example key: "person.address.street"
		// Traverse this object to return the value of a structured key
		const keyParts = key.split('\.'); // split *key* by dot
		let val = this;
		for (const k of keyParts)  {
			val = val[k];
			if (val === undefined) return undefined;
			else if (val === null) return null;
		}
		return val;
	}
});

Object.defineProperty(Array.prototype, 'sortBy', {value: function (key, desc) {
	return this.sort(function(a, b) {
		let va = a.deepValue(key);
		let vb = b.deepValue(key);
		if (typeof va === "string") {
			va = va.toLowerCase();
		}
		if (typeof vb === "string") {
			vb = vb.toLowerCase();
		}
		if (desc) {
			return (va > vb) ? -1 : ((va < vb) ? 1 : 0);
		} else {
			return (va < vb) ? -1 : ((va > vb) ? 1 : 0);
		}
	});
}});
