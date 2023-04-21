import { globSync } from "glob";
import normalize from "normalize-path";

export async function loadAll() {
	await loadCommands();
	await loadListeners();
}

export async function loadCommands() {
	const files = await globSync(`${normalize(process.cwd())}/dist/src/commands/**/*.js`);
	const returned: string[] = [];
	for (const file of files) {
		const exist = await import(file);
		if (exist) returned.push(exist);
	}
	return returned;
}

export async function loadListeners() {
	const files = await globSync(`${normalize(process.cwd())}/dist/src/listeners/**/*.js`);
	const returned: string[] = [];
	for (const file of files) {
		const exist = await import(file);
		if (exist) returned.push(exist);
	}
	return returned;
}