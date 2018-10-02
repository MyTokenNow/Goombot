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
});

client.on("message", message => {
	if (!message.member) return;

	if (lastMessages.has(message.author.id)) {
		const lastMessage = lastMessages.get(message.author.id);
		const sameContent = message.content === lastMessage.content;
		const smallDiff = message.createdTimestamp - lastMessage.createdTimestamp < 500;
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