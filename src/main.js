const util = require("util");
const Discord = require("discord.js");
const ZombieClient = require("./client/ZombieClient");
const logger = require("./util/logger.js");

const evalCommand = require("./commands/eval");

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

const avoiding = new Set();

const zombieRole = "Zombie Collection";
const mutedRole = "Muted";

const client = new ZombieClient({
	prefix: config.discord.prefix,
	owners: ["475181752353030145", "502016587180670976"]
});
const lastMessages = new Map();

client.command("eval", evalCommand)

client.once("ready", () => {
	logger.info("Ready...");
});

client.on("guildCreate", async guild => {
	if (!guild.roles.some(r => r.name === zombieRole)) {
		await guild.roles.create({
			data: {
				name: zombieRole,
				color: 0x00720e
			},
			reason: "Need more Zombies"
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
	const mRole = member.guild.roles.find(r => r.name === mutedRole);
	const zRole = member.guild.roles.find(r => r.name === zombieRole);
	const hasRole = member.roles.has(zRole.id);
	const isManageable = member.manageable;

	if (!hasRole && isManageable) {
		member.roles.add(zRole);
	}

	if (avoiding.has(member.id)) {
		member.roles.add(mRole);
	}

	const emoji = member.guild.emojis.find(e => e.name === "zombie");
	const channel = member.guild.channels.find(c => c.type === "text" && c.name === "general");
				
	if (emoji && channel) {
		channel.send(emoji.toString());
	}
});

client.on("guildMemberRemove", member => {
	const role = member.guild.roles.find(r => r.name === mutedRole);

	if (member.roles.has(role.id)) {
		avoiding.add(member.id);
	}
});

client.on("message", message => {
	if (message.author.bot) return;
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
				const e = message.guild.emojis.find(e => e.name === "zombie");
				
				if (e) {
					message.channel.send(`${e}`.repeat(5));
				}
			}
		}
	}

	lastMessages.set(message.author.id, message);
});

client.login(config.discord.token);

process.on("uncaughtException", err => logger.error(err.toString()));