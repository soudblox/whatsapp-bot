import type WAClient from './Client';
import type { CommandContext } from './CommandContext';
import { Commands } from '../managers/CommandManager';

export interface CommandOptions {
	name: string;
	aliases?: string[];
	description?: string;
	universal?: boolean;
	category?: string;
	run?: (ctx: CommandContext) => any;
}

export class Command {
	public client?: WAClient;
	public name: string;
	public aliases: string[];
	public description: string;
	public universal: boolean;
	public category: string;
	public run!: (ctx: CommandContext) => any;

	public constructor(options: CommandOptions) {
		if (options.run) this.run = options.run;
		this.name = options.name || '';
		this.description = options.description || options.name;
		this.universal = options.universal || false;
		this.aliases = options.aliases || [];
		this.category = options.category || 'uncategorized';

		Commands.register(this);
	}

	public unregister(): Command | undefined {
		return Commands.unregister(this.name);
	}

	public initialize(client: WAClient) {
		this.client = client;
	}
}