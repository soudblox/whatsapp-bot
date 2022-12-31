import { Listener } from "../../lib/structures/Listener";
import type WAClient from "../../lib/structures/Client";
import type { Message, MessageId } from "whatsapp-web.js";
import { MessageMedia, MessageTypes } from "whatsapp-web.js";
import { extension } from "mime-types";
import fs from "node:fs";

new Listener({
	name: "message_revoke_everyone",
	async run(client: WAClient, message: Message, revoked: Message) {
		const data = message.rawData as any;
		const group = message.fromMe ? message.to : message.from;
		if (!client.config.allowFeatures.snipes.includes((group))) return;

		if (message.hasMedia) {
			const ext = extension(data.mimetype);
			if (fs.existsSync(`./snipes/${message.timestamp}.${ext}`)) revoked.picture = MessageMedia.fromFilePath(`./snipes/${message.timestamp}.${ext}`);
		}

		const snipeCount = await client.database.add("snipeCount", 1);
		await client.database.set(`snipe${snipeCount}`, {
			notifyName: data.notifyName || "",
			mimetype: data.mimetype || "",
			id: revoked.id,
			body: revoked.body,
			type: revoked.type,
			timestamp: revoked.timestamp,
			from: revoked.from,
			to: revoked.to,
			author: revoked.author,
			isForwarded: revoked.isForwarded,
			forwardingScore: revoked.forwardingScore,
			hasQuotedMsg: revoked.hasQuotedMsg,
			vCards: revoked.vCards,
			mentionedIds: revoked.mentionedIds,
			isGif: revoked.isGif,
			links: revoked.links,
			picture: revoked.picture,
		} as TrimmedMessage);
	},
});

interface TrimmedMessage {
	notifyName: string;
	mimetype: string;
	id: MessageId;
	body: string;
	type: MessageTypes;
	timestamp: number;
	from: string;
	to: string;
	author?: string;
	isForwarded: boolean;
	forwardingScore: number;
	hasQuotedMsg: boolean;
	vCards: string[];
	mentionedIds: [];
	isGif: boolean;
	links: {
		link: string;
		isSuspicious: boolean;
	}[];
	picture?: MessageMedia;
}