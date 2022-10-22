import { Command } from '../../lib/structures/Command';

new Command({
	name: 'help',
	description: 'Sends the available commands',
	category: 'info',
	async run(ctx) {
		const { client } = ctx;
		const commands = client.commands;
		const categories = new Set(commands.map(a => a.category));
		const filteredCommands: {
			category?: string;
			commands?: string[];
		}[] = [];

		categories.forEach(category => {
			filteredCommands.push({
				category: category.replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase()),
				commands: commands.filter(command => command.category === category).map(c => `${c.name}${c.description ? ` - _${c.description}_` : ''}`),
			});
		});
		return await ctx.reply(filteredCommands.map(filtered => `*${filtered.category}*\n${filtered.commands?.join('\n')}`).join('\n\n'));
	},
});