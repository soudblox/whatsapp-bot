import { Command } from "../../lib/structures/Command";
import { fetch } from "undici";
import parser from "yargs-parser";
import * as process from "process";

new Command({
	name: "dictionary",
	description: "Search for a word's definition in dictionary.",
	category: "search",
	async run(ctx) {
		const { args, client } = ctx;
		if (!process.env.OXFORD_ID || !process.env.OXFORD_KEY) {
			await ctx.reply("This command is disabled because OXFORD_ID and OXFORD_KEY is not supplied in environment variables.");
			return client.log.error("OXFORD_ID/OXFORD_KEY not supplied in environment variables");
		}

		const parsed = parser(args.join(" "), {
			number: ["page"],
			configuration: {
				"short-option-groups": false,
			},
			alias: {
				page: ["p"],
			},
		});

		const query = parsed._.join(" ");
		let page = parsed.page || 1;

		try {
			const response = await fetch(`https://od-api.oxforddictionaries.com/api/v2/words/en-us?q=${encodeURIComponent(query)}`, {
				headers: {
					app_id: process.env.OXFORD_ID,
					app_key: process.env.OXFORD_KEY,
				},
			});
			const data = await response.json() as GetEntriesReponse;

			if (!data) return ctx.reply("The word you have entered is not found in Oxford dictionary.");

			const total = data.results.length;
			if (page > total) page = total;

			const results = data.results[page - 1];
			const word = results.word;
			const typeofWord = results.type;
			const phonetics: any = [];

			const definitions = results.lexicalEntries.filter(entry => entry.entries?.[0].senses).map((x) => `_${x.lexicalCategory.id}_\n\t${x.entries?.[0].senses?.map((a, b) => `${b + 1}. *${a.definitions?.[0]}*${a.examples ? `\n\t"${a.examples[0]?.text}"` : ""}`).join("\n\n\t")}`).join("\n\n");
			results.lexicalEntries.forEach(element => {
				if (element.entries?.[0].pronunciations) {
					phonetics.push(`/${element.entries[0].pronunciations.filter(a => a.phoneticNotation === "respell")[0]?.phoneticSpelling}/`);
				}
				else if (element.derivativeOf && typeofWord === "phrase") {
					phonetics.push(`phrase of ${element.derivativeOf[0].id}`);
				}
			});

			ctx.reply(`*${word}${toSuperscript(page.toString())}*${phonetics.join(", ") !== "" ? `\n${phonetics.join(", ")}` : ""}\n${typeofWord}\n\n${definitions}\n\nDefinition *${page}* of *${total}*`);
		}
		catch (err: any) {
			await client.log.error(err.stack);
			return ctx.reply("The word you have entered is not found in Oxford dictionary.");
		}
	},
});

function toSuperscript(input: string): string {
	const superscriptMap: { [key: string]: string } = {
		"0": "⁰",
		"1": "¹",
		"2": "²",
		"3": "³",
		"4": "⁴",
		"5": "⁵",
		"6": "⁶",
		"7": "⁷",
		"8": "⁸",
		"9": "⁹",
	};

	return input.replace(/[0123456789]/g, match => superscriptMap[match] || match);
}


// thanks copilot <3
interface GetEntriesReponse<Word extends string = string> {
	id: Word;
	metadata: {
		operation: string;
		provider: "Oxford University Press";
		schema: string;
	};
	results: HeadwordEntry[];
	word: Word;
}

interface HeadwordEntry<Word extends string = string> {
	id: Word;
	language: string;
	lexicalEntries: LexicalEntry[];
	pronunciations?: Pronunciation[];
	type?: "headword" | "inflection" | "phrase";
	word: Word;
}

interface LexicalEntry {
	compounds?: RelatedEntry[];
	derivativeOf?: RelatedEntry[];
	derivatives?: RelatedEntry[];
	entries?: Entry[];
	grammaticalFeatures: any;
	language: string;
	lexicalCategory: {
		id: string;
		text: string;
	};
	notes?: any;
	phrasalVerbs?: RelatedEntry[];
	phrases?: RelatedEntry[];
	pronunciations?: Pronunciation[];
	root?: string;
	text: string;
	variantForms?: any;
}

interface Pronunciation {
	audioFile?: string;
	dialects?: string[];
	phoneticNotation?: string;
	phoneticSpelling?: string;
	regions: any[];
	registers: any[];
}

interface Entry {
	crossReferenceMarkers?: string[];
	crossReferences?: any[];
	etymologies?: string[];
	grammaticalFeatures?: any[];
	homographNumber?: string;
	inflections?: { inflectedForm: string; }[];
	notes?: any[];
	pronunciations?: Pronunciation[];
	senses?: Sense[];
	variantForms?: any[];
}

interface Sense {
	antonyms?: SynonymsAntonyms[];
	constructions?: any[];
	crossReferenceMarkers?: string[];
	crossReferences?: any[];
	definitions?: string[];
	domainClasses?: any[];
	domains?: any[];
	etymologies?: string[];
	examples?: Definition[];
	id?: string;
	inflections?: any;
	notes?: any;
	pronunciations?: Pronunciation[];
	regions?: any;
	registers?: any;
	semanticClasses?: any;
	shortDefinitions?: string[];
	subsenses?: Sense[];
	synonyms?: SynonymsAntonyms[];
	thesaurusLinks?: any;
	variantForms?: any;
}

interface RelatedEntry {
	domains?: any[];
	id: string;
	language?: string;
	regions?: any[];
	registers?: any[];
	text: string;
}

interface Definition {
	definitions?: string[];
	domains?: any[];
	notes?: any[];
	regions?: any[];
	registers?: any[];
	senseIds?: string[];
	text: string;
}

interface SynonymsAntonyms {
	language: string;
	text: string;
}