import type WAClient from 'src/lib/structures/Client';
import { Listener } from '../../lib/structures/Listener';
import chalk from 'chalk';

new Listener({
	name: 'ready',
	async run(client: WAClient) {
		await client.database.connect();
		console.log(chalk.green('[READY]'), `${chalk.cyan('Client')} ${chalk.blue('is Ready	')}`);
	},
});