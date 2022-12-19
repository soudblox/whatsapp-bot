import { Command } from "../../lib/structures/Command";

new Command({
	name: "test",
	description: "A testing command",
	category: "owner",
	async run(ctx) {
		await ctx.reply("Soon™");
	},
});