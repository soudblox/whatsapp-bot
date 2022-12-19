import { Listener } from "../../lib/structures/Listener";
import type WAClient from "../../lib/structures/Client";
import qrcode from "qrcode";

new Listener({
	name: "qr",
	run: (client: WAClient, qr: string) => {
		qrcode.toString(qr, { type: "terminal", small: true }, function(_, url) {
			client.log.info("Generated QR Code:");
			console.log(url);
		});
	},
});