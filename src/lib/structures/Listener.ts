import { Listeners } from "../managers/ListenerManager";
import type WAClient from "./Client";

interface ListenerOptions {
	name: string;
	once?: boolean;
	run: (...args: any[]) => any;
}

export class Listener {
	public client?: WAClient;
	public name: string;
	public once?: boolean;
	public run!: (...args: any[]) => any;

	public constructor(options: ListenerOptions) {
		if (this.run) options.run = this.run;

		this.name = options.name;
		this.once = options.once || false;
		this.run = options.run;

		Listeners.register(this);
	}

	public initialize(client: WAClient): void {
		this.client = client;

		client[this.once ? "once" : "on"](
			this.name,
			this._run.bind(this),
		);
	}

	public unregister(): Listener | void {
		return Listeners.unregister(this.name);
	}

	public async _run(...args: Array<any>): Promise<void> {
		await Promise.resolve(this.run.call(this, this.client, ...args)).catch(error => {
			console.error(error);
		});
	}
}