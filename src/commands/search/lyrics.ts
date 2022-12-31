import { Command } from "../../lib/structures/Command";
import { fetch } from "undici";
import * as cheerio from "cheerio";

new Command({
	name: "lyrics",
	description: "Searches the lyrics for a song",
	category: "search",
	async run(ctx) {
		const query = ctx.args.slice(0).join(" ") || "never gonna give you up";

		const searchResponse = await fetch(`https://www.musixmatch.com/search/${encodeURIComponent(query)}`);
		const searchData = await searchResponse.text();
		const $1 = cheerio.load(searchData);
		const link = $1("h2.media-card-title a")[0].attribs.href;

		const lyricsResponse = await fetch(`https://musixmatch.com${link}`);
		const lyricsData = await lyricsResponse.text();
		const $2 = cheerio.load(lyricsData);

		const title = $2("h1.mxm-track-title__track").text().replace("Lyrics", "");
		const artistArray: string[] = [];
		$2("a.mxm-track-title__artist-link").each((_, child) => {
			// @ts-expect-error
			artistArray.push(child.children[0]?.data);
		});
		const artist = artistArray.join(", ");

		const arr: string[] = [];
		$2("span.lyrics__content__ok").each((_, b) => {
			arr.push($2(b).text());
		});
		const lyrics = arr.join("\n");

		return ctx.reply(`*${title} by ${artist}*\n\n${lyrics}`);
	},
});