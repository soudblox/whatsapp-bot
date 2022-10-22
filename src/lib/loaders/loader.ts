import { promisify } from 'node:util';
import glob from 'glob';
import normalize from 'normalize-path';
const globPromise = promisify(glob);

export async function loadAll() {
	await loadCommands();
	await loadListeners();
}

export async function loadCommands() {
	const files = await globPromise(`${normalize(process.cwd())}/dist/src/commands/**/*.js`);
	const returned: string[] = [];
	for (const file of files) {
		const exist = await import(file);
		if (exist) returned.push(exist);
	}
	return returned;
}

export async function loadListeners() {
	const files = await globPromise(`${normalize(process.cwd())}/dist/src/listeners/**/*.js`);
	const returned: string[] = [];
	for (const file of files) {
		const exist = await import(file);
		if (exist) returned.push(exist);
	}
	return returned;
}