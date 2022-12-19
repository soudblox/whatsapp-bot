import type WAClient from "../structures/Client";
import { Listener } from "../structures/Listener";
import { Collection } from "@discordjs/collection";

export class ListenerManager extends Collection<string, Listener> {
	private client!: WAClient;

	public register(listener: Listener): ListenerManager {
		// noinspection SuspiciousTypeOfGuard
		if (!(listener instanceof Listener)) throw new Error("Listener must be an instance of Listener.");
		if (this.client) this.initialize(listener);
		this.set(listener.name, listener);
		this.client.log.info(`[MANAGER] Registered listener ${listener.name}`);
		return this;
	}

	public unregister(name: string): Listener | undefined {
		const listener = this.get(name);
		if (listener) {
			this.delete(name);

			if (this.client) {
				const maxListeners = this.client.getMaxListeners();
				if (maxListeners !== 0) this.client.setMaxListeners(maxListeners - 1);

				this.client.off(
					listener.name,
					listener._run,
				);
			}

			this.client.log.info(`[MANAGER] Unregistered listener ${listener.name}`);
		}

		return listener;
	}

	private initialize(listener: Listener): Listener {
		const maxListeners = this.client.getMaxListeners();
		if (maxListeners !== 0) this.client.setMaxListeners(maxListeners + 1);

		listener.initialize(this.client);

		return listener;
	}

	public async initiate(client: WAClient): Promise<void> {
		this.client = client;
		this.forEach(listener => listener.initialize(client));
	}
}

export const Listeners = new ListenerManager();