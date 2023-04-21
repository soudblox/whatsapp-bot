import type { GroupChat, Message } from "whatsapp-web.js";
import { MessageTypes } from "whatsapp-web.js";
import type WAClient from "../../lib/structures/Client";
import { Listener } from "../../lib/structures/Listener";
import { prefix } from "../../config";
import { CommandContext } from "../../lib/structures/CommandContext";
import { extension } from "mime-types";
import fs from "node:fs";

interface User {
	name: string;
	messages?: Record<string, {
		total: number,
		daily: number;
		weekly: number;
		monthly: number;
	}>;
}

// just so that i don't use the 'any' type
interface rawData {
	notifyName: string;
}

new Listener({
	name: "message_create",
	async run(client: WAClient, message: Message) {
		handleMessage(client, message)
			.then()
			.catch((err) => {
				client.log.error(`[COMMANDS] Error: ${err.stack}`);
			});
	},
});

async function handleMessage(client: WAClient, message: Message) {
	// variables
	const { allowCommands, allowFeatures, watchGroups, gcId } = client.config;
	const contact = await message.getContact();
	message.contact = contact;
	const content = message.caption || message.body;
	message.content = content;
	const group = message.fromMe ? message.to : message.from;
	const userId: string = message.fromMe ? message.from : message.author || "00000000@c";
	const username = message.contact.name || message.contact.pushname || (message.rawData as rawData).notifyName || "Unknown";
	message.user = {
		id: userId,
		name: username,
	};

	// handle commands here
	if (content.toLowerCase().startsWith(prefix)) {
		const [commandName, ...args] = content
			.slice(prefix?.length)
			.trim()
			.split(/ +/g);

		if (commandName.length === 0) return;

		const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases.includes(commandName));
		if (!command) return;

		if (!command.universal && !allowCommands.includes(group)) return;
		const ctx = new CommandContext(message, client, args);
		await Promise.resolve(command.run(ctx))
			.then(async () => {
				client.log.info(`[COMMANDS] ${username} (${await client.getFormattedNumber(contact.number)}) used the command ${command.name}`);
			})
			.catch((err) => {
				client.log.error(`[COMMANDS] Error: ${err.stack}`);
				return message.reply(`An error has occurred while executing the command ${command.name}`);
			});
	}

	// handle sent messages from groups in watchGroups
	if (watchGroups.includes(group)) {
		const gc = await client.getChats().then(a => a.find(b => b.id._serialized === gcId));
		const fetched = await client.getChatById(group) as GroupChat;
		let media;

		if (message.hasMedia) {
			media = await message.downloadMedia();
		}

		if (message.type === MessageTypes.STICKER && media) {
			gc?.sendMessage(`${message.isForwarded ? `_Forwarded ${message.forwardingScore} times_\n` : ""}${contact.name || contact.pushname || "unknown"} sent a sticker in ${fetched.name}`);
			return gc?.sendMessage(media, { sendMediaAsSticker: true, sendSeen: false });
		}

		return gc?.sendMessage(`${message.isForwarded ? `_Forwarded ${message.forwardingScore} times_\n` : ""}${message.caption ? "Message" : "Media"} from ${fetched.name}:${message.caption ? `\n\n${contact.name || contact.pushname || "unknown"}: ${content}` : ""}`, {
			sendSeen: false,
			parseVCards: true,
			media,
		});
	}

	if (allowFeatures.snipes.includes(group)) {
		if (message.hasMedia) {
			const media = await message.downloadMedia();
			const ext = extension(media.mimetype);

			if (fs.existsSync("./snipes/")) {
				fs.writeFileSync(`./snipes/${message.timestamp}.${ext}`, media.data, { encoding: "base64" });
			} else {
				fs.mkdirSync("./snipes");
				fs.writeFileSync(`./snipes/${message.timestamp}.${ext}`, media.data, { encoding: "base64" });
			}
		}
	}

	if (allowFeatures.messages.includes(group)) {
		// message counter
		if (!client.database.ready) return;
		const user: User | undefined = await client.database.get(userId.replace("@c.us", "@c"));
		const currentMessages = user?.messages?.[group] || {
			total: 0,
			daily: 0,
			weekly: 0,
			monthly: 0,
		};

		await client.database.set(userId.replace("@c.us", "@c"), {
			name: username,
			messages: {
				[group]: {
					total: ++currentMessages.total,
					daily: ++currentMessages.daily,
					weekly: ++currentMessages.weekly,
					monthly: ++currentMessages.monthly,
				},
			},
		} as User);
	}
	return;
}