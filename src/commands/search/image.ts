import { MessageMedia } from "whatsapp-web.js";
import { fetch } from "undici";
import { Command } from "../../lib/structures/Command";
import parser from "yargs-parser";

new Command({
	name: "image",
	description: "Searches for an image on Google.",
	aliases: ["img"],
	async run(ctx) {
		const { args, client } = ctx;
		const parsed = parser(args.join(" "), {
			number: ["page"],
			configuration: {
				"short-option-groups": false,
			},
			alias: {
				page: ["p"],
			},
		});

		const query = parsed._.join(" ");
		let page = parsed.page || 1;

		if (!query) return ctx.reply("You did not provide any query!");

		try {
			const apiKey = await client.database.get("googleKey") || process.env.SERPAPI || "";
			const response = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&safe=active&tbm=isch&api_key=${apiKey}`);
			const res = await response.json() as Result;

			const results = res.images_results;
			if (results.length < 1) return ctx.reply("No image results were found.");
			if (page > results.length) page = results.length;

			const fetchedMetadata = await fetchImgMetadata(results[page - 1].original);
			const imageURL = fetchedMetadata.isValid ? results[page - 1].original : results[page - 1].thumbnail;
			const image = await getBase64(imageURL);
			const media = new MessageMedia(fetchedMetadata.type || "image/png", image);
			return ctx.reply(`Result ${page} of ${results.length}`, ctx.chatId, { media: media });
		} catch (err) {
			client.log.error((err as any).stack);
			return ctx.reply("An error has occured whilst searching for images.");
		}
	},
});

async function getBase64(url: string) {
	const response = await fetch(url);
	const res = await response.arrayBuffer();
	// TODO: find a way to not do this
	const buf = Buffer.from((res as unknown as string), "binary");
	const base64 = buf.toString("base64");
	return base64;
}

async function fetchImgMetadata(url: string) {
	const response = await fetch(url);
	return { type: response.headers.get("content-type"), isValid: response.headers.get("content-type")?.startsWith("image") };
}

interface Result {
	images_results: {
		position: number;
		thumbnail: string;
		source: string;
		title: string;
		link: string;
		original: string;
	}[]
}