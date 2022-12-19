import type WAClient from "src/lib/structures/Client";
import { Listener } from "../../lib/structures/Listener";

new Listener({
	name: "ready",
	async run(client: WAClient) {
		await client.database.connect();
		client.log.success("[CONNECTION] Successfully logged in WhatsApp");
	},
});