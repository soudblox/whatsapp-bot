import { Command } from "../../lib/structures/Command";

new Command({
	name: "ping",
	description: "Ping command",
	async run(ctx) {
		await ctx.reply("Pong 🏓");
	},
});