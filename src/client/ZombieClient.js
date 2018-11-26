const { Client } = require("discord.js");

class GoombotClient extends Client {
	constructor(options) {
		super(options);

		this.owners = options.owners;
		this.prefix = options.prefix;
		this.commands = new Map();

		this.on("message", m => {
			if (m.author.bot) return;

			const hasPrefix = m.content.startsWith(this.prefix);
			const hasMention = m.content.startsWith(this.user.toString());

			if (hasPrefix || hasMention) {
				let content;

				if (hasPrefix) {
					content = m.content.replace(this.prefix, "");
				} else {
					content = m.content.replace(this.user.toString(), "");
				}

				const [command, ...args] = content.trim().split(/\s+/);

				if (this.commands.has(command)) {
					this.commands.get(command).call(this, m, args);
				}
			}
		});
	}

	command(names, fn) {
		if (!(names instanceof Array)) names = [names];

		for (const name of names) {
			this.commands.set(name, fn);
		}
	}
}

module.exports = ZombieClient;