import "dotenv/config";
import { LocalAuth } from "whatsapp-web.js";
import { loadAll } from "./lib/loaders/loader";
import { Listeners } from "./lib/managers/ListenerManager";
import { Commands } from "./lib/managers/CommandManager";
import WAClient from "./lib/structures/Client";

const client = new WAClient({
	puppeteer: {
		headless: false,
		args: [
			"--disable-gpu",
			"--disable-dev-shm-usage",
			"--disable-setuid-sandbox",
			"--no-sandbox",
		],
		executablePath: "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
	},
	authStrategy: new LocalAuth(),
});

(async () => {
	await Listeners.initiate(client);
	await Commands.initiate(client);
	await loadAll();
})();

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
}