import "dotenv/config";
import { LocalAuth } from "whatsapp-web.js";
import { loadAll } from "./lib/loaders/loader";
import { Listeners } from "./lib/managers/ListenerManager";
import { Commands } from "./lib/managers/CommandManager";
import WAClient from "./lib/structures/Client";

const client = new WAClient({
	puppeteer: {
		headless: false,
		executablePath: process.env.EXECUTABLE_PATH,
	},
	authStrategy: new LocalAuth(),
});

(async () => {
	await Listeners.initiate(client);
	await Commands.initiate(client);
	await loadAll();
})();

client.getLastSeen = function getLastSeen(chId: string) {
	return client.pupPage?.evaluate(cId => {
		const getLastS = (chatId: string) => {
			return new Promise(resolve => {
				// @ts-expect-error
				const chat = window.Store.Chat.get(chatId);
				chat.presence.subscribe()
					.then(() => {
						if (chat.presence.chatstate.t) {
							return resolve(chat.presence.chatstate.t);
						}

						let timeout: number;
						const handle = () => {
							clearTimeout(timeout);
							resolve(chat.presence.chatstate.t);
						};

						setTimeout(() => {
							chat.presence.chatstate.off("all", handle);
							resolve(undefined);
						}, 15000);

						chat.presence.chatstate.once("all", handle);
					});
			});
		};
		return getLastS(cId);
	}, chId);
};

client.initialize();

declare module "whatsapp-web.js" {
	interface MessageSendOptions {
		mentionedIds?: string[];
	}

	interface Message {
		contact?: Contact;
		content?: string;
		caption?: string;
		picture?: MessageMedia;
		user?: {
			id?: string;
			name?: string;
		};
	}

	interface Client {
		getLastSeen: any;
	}
}