import type { GroupChat, Message, MessageContent, MessageSendOptions } from "whatsapp-web.js";
import type WAClient from "./Client";

export class CommandContext {
	public message: Message;
	public client: WAClient;
	public args: any[];

	constructor(message: Message, client: WAClient, args: any[]) {
		this.message = message;
		this.client = client;
		this.args = args;
	}

	get chatId() {
		return this.message.fromMe ? this.message.to : this.message.from;
	}

	async getParticipants() {
		const chat = (await this.message.getChat() as GroupChat);
		if (!chat.isGroup) return [];

		const participants = chat.participants;
		return participants.map(p => `@${p.id.user}`);
	}

	async getChat() {
		return await this.message.getChat();
	}

	async reply(body: MessageContent, chatId?: string, options?: MessageSendOptions) {
		if (!options) options = {};
		if (!chatId) chatId = this.chatId;
		if (typeof body === "string") {
			if (body.match(/@(\d*)/g)?.filter(x => x.length > 5)) options.mentionedIds = body.match(/@(\d*)/g)?.filter(x => x.length > 5).map(a => a.replace("@", ""));
			if (options?.mentionedIds && Array.isArray(options.mentionedIds)) (options.mentions as any) = (options.mentionedIds.map((mention) => {
				return { id: { _serialized: mention.endsWith("@c.us") ? mention.endsWith("@") ? mention : mention.replace("@", "@c.us") : `${mention}@c.us` } };
			}));
		}
		options.sendSeen = false;

		return await this.message.reply(body, chatId, options);
	}
}