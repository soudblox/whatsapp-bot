/* eslint-disable @typescript-eslint/ban-types */
import { Command } from "../../lib/structures/Command";
import { inspect } from "util";
import parser from "yargs-parser";
import type { CommandContext } from "../../lib/structures/CommandContext";

new Command({
	name: "eval",
	description: "Owner only command",
	category: "owner",
	async run(ctx) {
		if (ctx.message.user?.id !== ctx.client.config.ownerId) return ctx.reply("You do not have permission to run this command");
		const args = ctx.args.join(" ");

		const parsed = parser(args, {
			boolean: ["async", "silent"],
			configuration: {
				"short-option-groups": false,
			},
			alias: {
				async: ["a"],
				silent: ["s"],
			},
		});

		const code = parsed._.slice(0).join(" ");
		const { result, success } = await runEval(ctx, code, parsed.async);
		if (parsed.silent) return;

		const output = success ? result : `*ERROR*: ${result})}`;
		return ctx.reply(output);
	},
});

async function runEval(ctx: CommandContext, code: string, async: boolean) {
	// @ts-expect-error
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { client, message } = ctx;
	if (async) code = `(async () => {\n${code}\n})();`;

	let success = true;
	let result;

	try {
		result = eval(code);
	} catch (error) {
		result = error;
		success = false;
	}

	if (isThenable(result)) result = await result;

	if (typeof result !== "string") {
		result = inspect(result, {
			depth: 1,
			showHidden: false,
		});
	}

	return { result, success };
}

interface Thenable {
	then: Function;
	catch: Function;
}

function hasThen(input: { then?: Function }): boolean {
	return Reflect.has(input, "then") && isFunction(input.then);
}

function hasCatch(input: { catch?: Function }): boolean {
	return Reflect.has(input, "catch") && isFunction(input.catch);
}

function isThenable(input: unknown): input is Thenable {
	if (typeof input !== "object" || input === null) return false;
	return input instanceof Promise || (input !== Promise.prototype && hasThen(input) && hasCatch(input));
}

function isFunction(input: unknown): input is Function {
	return typeof input === "function";
}