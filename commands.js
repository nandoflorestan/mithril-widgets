/*
// Example for commands that run in the client.
// Inspiration: https://www.dofactory.com/javascript/command-design-pattern
exampleCommand = {
	name: 'notImplemented',
	run: function (context, payload) { // jshint ignore:line
		throw new Error('Not implemented.');
	},
	undo: function (context, payload) { // jshint ignore:line
		throw new Error('Not implemented.');
	},  // undo is optional.
};
*/


class Commands { // jshint ignore:line
	constructor() {
		this.commands = {};  // registered, available commands
		// this.history = [];  // history of executed commands
	}

	register(commandObject) {
		if (!commandObject.name)
			throw new Error(`Command must have a name.`);
		if (!commandObject.run)
			throw new Error(`Command must implement run()`);
		this.commands[commandObject.name] = commandObject;
	}

	run(context, name, payload) {
		if (!context || !name || !payload)
			throw new Error(`run() called without proper arguments.`);
		const ret = this.commands[name].run(context, payload);
		// Should always go through this function if in the future you might
		// want to do one of these 2 things:
		// this.history.push({context, name, payload});
		// console.log(`Command ${name} called with ${payload} returns ${ret}`);
		return ret;
	}

	/*
	undo() {
		const cmd = this.history.pop();
		const commandObject = this.commands[cmd.name];
		if (!commandObject.undo)
			throw new Error(`The command ${cmd.name} cannot be undone.`);
		const ret = commandObject.undo(cmd.context, cmd.payload);
		return ret;
	}
	*/

	runAll(context, commands) {
		for (const command of commands) {
			this.run(context, command.name, command.payload);
		}
	}
}
