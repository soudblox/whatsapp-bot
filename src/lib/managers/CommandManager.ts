import { Command } from '../structures/Command';
import { Collection } from '@discordjs/collection';
import type WAClient from '../structures/Client';
import chalk from 'chalk';

export class CommandManager extends Collection<string, Command> {
	private client!: WAClient;

	public register(command: any): CommandManager {
		if (!(command instanceof Command)) throw new Error('Command must be an instance of Command.');
		if (this.client) command.initialize(this.client);
		this.set(command.name, command);
		console.log(`${chalk.green('Registered')} ${chalk.cyan('Command')} ${chalk.blue(command.name)}`);
		return this;
	}

	public unregister(commandName: string): Command | undefined {
		const command = this.get(commandName);
		if (command) {
			this.delete(commandName);
			console.log(`Unregistered command ${command.name}`);
		}

		return command;
	}

	public async initiate(client: WAClient): Promise<void> {
		this.client = client;
		this.forEach(command => command.initialize(client));
	}
}

export const Commands = new CommandManager();