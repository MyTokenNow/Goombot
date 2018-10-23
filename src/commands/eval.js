const util = require("util");
const ytdl = require("ytdl-core");
const Discord = require("discord.js");

function clean(text, client) {
	const tokenRegex = new RegExp(client.token);
	const cookedTextRegex = /([`@])/g;

	return `${text}`
		.replace(tokenRegex, "[REMOVED]")
		.replace(cookedTextRegex, `$1${String.fromCharCode(8203)}`);
}

function format(input, type, output ) {
	return `**INPUT**\n\`\`\`js\n${input}\n\`\`\`\n**${type}**\n\`\`\`js\n${output}\n\`\`\``;
}

async function evalCommand(message, args) {
	if (!message.client.owners.includes(message.author.id)) return;

	const client = message.client;
	const code = args.join(" ");

	let output;
	let outputType = "OUTPUT";

	try {
		output = await eval(code);
	} catch (err) {
		output = err;
	}

	const cleanInput = clean(code, client);

	if (output instanceof Error) {
		output = output.toString();
		outputType = "ERROR";
	} else if (typeof output !== "string") {
		output = util.inspect(output, { depth: 0 });
	}

	const cleanOutput = clean(output, client);
	const formattedOutput = format(cleanInput, outputType, cleanOutput);

	await message.channel.send(formattedOutput);
}

module.exports = evalCommand;