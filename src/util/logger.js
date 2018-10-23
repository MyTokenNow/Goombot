const chalk = require("chalk");

const logger = {
	debug(...m) {
		console.debug(`${chalk.magenta("[DEBUG]")} ${m.join(" ")}`)
	},
	info(...m) {
		console.info(`${chalk.green("[INFO]")} ${m.join(" ")}`)
	},
	warn(...m) {
		console.warn(`${chalk.yellow("[WARN]")} ${m.join(" ")}`)
	},
	error(...m) {
		console.error(`${chalk.red("[ERROR]")} ${m.join(" ")}`)
	}
};

module.exports = logger;