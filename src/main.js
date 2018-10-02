const util = require("util");
const ytdl = require("ytdl-core");
const Discord = require("discord.js");
const SmorcClient = require("./client/SmorcClient");
const logger = require("./logger.js");

let config;

try {
	config = require("../config.json");
} catch (err) {
	config = {
		discord: {
			token: process.env.DISCORD_TOKEN,
			prefix: process.env.DISCORD_PREFIX
		}
	};
}

const smorcRole = "SMOrc Collection";
const mutedRole = "Muted";

const client = new SmorcClient({ prefix: config.discord.prefix });
const lastMessages = new Map();

function _clean(text, client) {
	const tokenRegex = new RegExp(client.token);
	const cookedTextRegex = /([`@])/g;

	return `${text}`
		.replace(tokenRegex, "[REMOVED]")
		.replace(cookedTextRegex, `$1${String.fromCharCode(8203)}`);
}

function _format(input, type, output ) {
	return `**INPUT**\n\`\`\`js\n${input}\n\`\`\`\n**${type}**\n\`\`\`js\n${output}\n\`\`\``;
}

client.command("eval", async (message, args) => {
	if (!(["463702618162855956", "496315115855937547"].includes(message.author.id))) return;

	const client = message.client;
	const code = args.join(" ");

	let output;
	let outputType = "OUTPUT";

	try {
		output = await eval(code);
	} catch (err) {
		output = err;
	}

	const cleanInput = _clean(code, client);

	if (output instanceof Error) {
		output = output.toString();
		outputType = "ERROR";
	} else if (typeof output !== "string") {
		output = util.inspect(output, { depth: 0 });
	}

	const cleanOutput = _clean(output, client);
	const formattedOutput = _format(cleanInput, outputType, cleanOutput);

	await message.channel.send(formattedOutput);
});

client.once("ready", () => {
	logger.info("Ready...");
});

client.on("guildCreate", async guild => {
	if (!guild.roles.some(r => r.name === smorcRole)) {
		await guild.roles.create({
			data: {
				name: smorcRole,
				color: 0x1f7f1f
			},
			reason: "Need more SMOrcs"
		});
	}

	if (!guild.roles.some(r => r.name === mutedRole)) {
		const role = await guild.roles.create({
			data: {
				name: mutedRole,
				color: 0x5e3e00
			},
			reason: "People are spamming."
		});

		guild.channels
			.filter(c => c.type === "text")
			.forEach(c => c.overwritePermissions({
				overwrites: [
					{
						id: role.id,
						deny: 2048
					}
				],
				reason: "So people stop spamming."
			}));
	}
});

client.on("guildMemberAdd", member => {
	const role = member.guild.roles.find(r => r.name === smorcRole);
	const hasRole = member.roles.has(role.id);
	const isManageable = member.manageable;

	if (!hasRole && isManageable) {
		member.roles.add(role);
	}

	const emoji = member.guild.emojis.find(e => e.name === "SMOrc");
	const channel = member.guild.channels.find(c => c.type === "text" && c.name === "general");
				
	if (emoji && channel) {
		channel.send(emoji.toString());
	}
});

client.on("message", message => {
	if (!message.member) return;

	if (lastMessages.has(message.author.id)) {
		const lastMessage = lastMessages.get(message.author.id);
		const sameContent = message.content === lastMessage.content;
		const smallDiff = message.createdTimestamp - lastMessage.createdTimestamp < 2000;
		const canMute = message.member.manageable;

		if (sameContent && smallDiff) {
			if (canMute) {
				const role = message.guild.roles.find(r => r.name === mutedRole);
				message.member.roles.add(role);
			} else {
				const e = message.guild.emojis.find(e => e.name === "SMOrc");
				
				if (e) {
					message.channel.send(`${e} ME ORC ${e} ME SPAM ${e} NO MODS ${e} NO BAN ${e}`);
				}
			}
		}
	}

	lastMessages.set(message.author.id, message);
});

client.login(config.discord.token);

process.on("uncaughtException", err => logger.error(err.toString()));