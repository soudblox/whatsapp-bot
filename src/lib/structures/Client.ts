import { Commands } from '../managers/CommandManager';
import { Listeners } from '../managers/ListenerManager';
import { Client, ClientOptions } from 'whatsapp-web.js';
import { Database } from 'quickmongo';
import { QuickDB } from 'quick.db';
import * as config from '../../config';

export default class WAClient extends Client {
	public config: typeof config;
	public commands: typeof Commands;
	public listener: typeof Listeners;
	public database: Database;
	public sqlite: QuickDB;

	public constructor(options: ClientOptions) {
		super(options);

		this.config = config;
		this.commands = Commands;
		this.listener = Listeners;
		this.database = new Database(process.env.MONGO || '');
		this.sqlite = new QuickDB();
	}
}