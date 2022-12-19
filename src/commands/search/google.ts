import { Command } from "../../lib/structures/Command";
import { fetch } from "undici";
import parser from "yargs-parser";

new Command({
	name: "google",
	description: "Search Google from WhatsApp",
	async run(ctx) {
		const { args, client } = ctx;
		if (args.length < 1) return ctx.reply("You need to provide a query you pea brain	");

		const parsed = parser(args.join(" "), {
			number: ["page"],
			boolean: ["results", "knowledge", "snippet"],
			configuration: {
				"short-option-groups": false,
			},
			alias: {
				results: ["r"],
				knowledge: ["k"],
				snippet: ["s"],
			},
		});

		const query = parsed._.join(" ");
		const page = parsed.page || 1;
		let useResults = parsed.results;
		let useKnowledge = parsed.knowledge;
		let useSnippet = parsed.snippet;

		if (!useResults || !useKnowledge || !useSnippet) useSnippet = true;

		if (useResults === true && useKnowledge === true || useResults === true && useResults === true || useKnowledge === true && useResults === true)
			return ctx.reply("can't have 2 search types at the same time");

		if (isNaN(page)) return ctx.reply("Page has to be a number!");

		try {
			const apiKey = await client.database.get("googleKey") || process.env.SERPAPI || "";
			if (!apiKey) return ctx.reply("Command disabled because no key is provided.");

			const response = await fetch(`https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&location=Canada&google_domain=google.ca&gl=ca&hl=en&device=desktop&api_key=${apiKey}`);
			const res = await response.json() as SearchResponse;
			const knowledgePanel = res?.knowledge_graph;
			const organicResults = res?.organic_results;
			const answerBox = res?.answer_box;

			if (res.error) return ctx.reply("An error has occurred whilst searching");
			if (!organicResults || organicResults?.length < 1) return ctx.reply("No results. What...?");

			if (!answerBox && useSnippet) {
				useSnippet = false;
				useKnowledge = true;
			}

			if (!knowledgePanel && useKnowledge) {
				useKnowledge = false;
				useResults = true;
			}

			if (useSnippet) {
				if (!answerBox) return ctx.reply("Failed to search.");
				switch (answerBox.type) {
					case "calculator_result": {
						return ctx.reply(`${answerBox.result}`);
					}
					case "weather_result": {
						const location = answerBox.location || "Unknown";
						const date = answerBox.date || "Unknown";
						const wind = answerBox.wind || "Unknown";
						const weather = answerBox.weather || "Unknown";
						const temperature = answerBox.temperature || 0;
						const celsius = answerBox.unit === "Celsius" ? temperature.toString() : Math.round((parseFloat(temperature.toString()) - 32) / 1.8).toString();
						const fahrenheit = answerBox.unit === "Fahrenheit" ? temperature.toString() : Math.round((parseFloat(temperature.toString()) * 1.8) + 32).toString();

						return ctx.reply(`*${location}*\n*${date}*\n\n${weather}\nTemperature: ${celsius} C° / ${fahrenheit} F°\nWind: ${wind}`);
					}
					case "finance_results": {
						return ctx.reply("The given result is a finance result, and this command is not yet supported to show those types of results.");
					}
					case "population_result": {
						const place = answerBox.place || "Unknown";
						const population = answerBox.population || "Unknown";
						const year = answerBox.year || "Unknown";
						return ctx.reply(`*${place}* population: ${population} (${year})`);
					}
					case "currency_converter": {
						return ctx.reply(`${answerBox.currency_converter?.from.price} ${answerBox.currency_converter?.from.currency} is equal to ${answerBox.currency_converter?.to.price} ${answerBox.currency_converter?.to.currency}`);
					}
					case "google_flights": {
						return ctx.reply("The given result is a flight result, and this command is not yet supported to show those types of results.");
					}
					case "hotels": {
						return ctx.reply("The given result is a hotel result, and this command is not yet supported to show those types of results.");
					}
					case "dictionary_results": {
						const definitions = answerBox.definitions || ["Unknown"];
						const examples = answerBox.examples || "Unknown";
						const final: {
							definition?: string;
							example?: string;
						}[] = [];

						for (let i = 0; i < Math.max(definitions.length, examples.length); i++) {
							final.push({ definition: definitions[i] ?? "", example: examples[i] ?? "" });
						}
						return ctx.reply(`*${answerBox.syllables}*\n${answerBox.phonetic}\n\n_${answerBox.word_type}_\n\t${final.map((a, b) => `${b + 1}. *${a.definition}*${a.example ? `\n\t"${a.example}"` : ""}`).join("\n\n\t")}`);
					}
					case "organic_result": {
						if (!answerBox.snippet && answerBox.contents?.table) return ctx.reply("The given result is a table result, and this command is not yet supported to show those types of results.");
						if (answerBox.answer && answerBox.snippet) return ctx.reply(`${answerBox.title}\n\n*${answerBox.answer}*\n${answerBox.snippet}\n\n${answerBox.link}`);
						return ctx.reply(`*${answerBox.title}*\n${answerBox.snippet || answerBox.answer}\n\n${answerBox.link}`);
					}
					case "translation_result": {
						const translation = answerBox.translation;
						if (!translation) return ctx.reply("Failed to search");

						const { source, target } = translation;
						return ctx.reply(`${source.language} → ${target.language}\n\n${target.text}`);
					}
					case "directions": {
						return ctx.reply("The given result is a Google Map result, and this command is not yet supported to show those types of results.");
					}
					case "formula": {
						return ctx.reply("The given result is a formula result, and this command is not yet supported to show those types of results.");
					}
					case "unit_converter": {
						return ctx.reply(`${answerBox.from?.value} ${answerBox.from?.unit} is equal to ${answerBox.to?.value} ${answerBox.to?.unit}`);
					}
				}
			} else if (useKnowledge) {
				if (!knowledgePanel) return ctx.reply("Failed to search.");
				let description = "";
				if (knowledgePanel.type && knowledgePanel.type.length > 0 && knowledgePanel.type !== "N/A") {
					description += `_${knowledgePanel.type}_`;
				}
				if (knowledgePanel.description) {
					description += `\n\n${knowledgePanel.description}`;
				}

				for (let knowledge in knowledgePanel) {
					const data = knowledgePanel[knowledge as keyof typeof knowledgePanel];
					if (knowledge === "total" || knowledge === "description" || knowledge === "url" || knowledge === "type" || knowledge.includes("link") || knowledge.includes("also") || knowledge.includes("cite") || knowledge.includes("stick") || Array.isArray(knowledge) || data?.constructor.name == "Array") continue;
					knowledge = knowledge.replace(/_/g, " ");
					knowledge = knowledge.replace(/^\w|(\s+\w)/g, (letter: string) => letter.toUpperCase());
					description += `\n\n*${knowledge}*\n${data}`;
				}
				return ctx.reply(`*${knowledgePanel.title}*\n${description}`);
			} else if (useResults) {
				const result = organicResults[page - 1];
				return ctx.reply(`*${result.title}*\n${result.snippet}\n\n${result.link}`);
			}
		} catch (err) {
			const error = err as any;
			if (error.code === 429) return ctx.reply("API key has expired, please let me know so it can be updated.");
			console.log(error);
			return ctx.reply("An error has occurred whilst trying to search.");
		}
		return "e";
	},
});

interface SearchResponse {
	organic_results?: Result[];
	answer_box?: AnswerBox;
	knowledge_graph?: KnowledgePanel;
	error?: string;
}

interface Result {
	position: number;
	title: string;
	link: string;
	displayed_link: string;
	snippet: string;
	about_page_link: string;
	cached_page_link: string;
}

interface AnswerBox {
	type: string;
	result: string;
	link: string;
	title?: string;
	displayed_link: string;
	snippet?: string;
	refinements?: string[];
	answer?: string;
	population?: string;
	year?: string;
	other?: {
		place: string;
		population: string;
	}[];
	place?: string;
	temperature?: string;
	unit?: "Fahrenheit" | "Celsius";
	wind?: string;
	location?: string;
	date?: string;
	weather?: string;
	price?: number;
	currency?: string;
	syllables?: string;
	phonetic?: string;
	word_type?: string;
	definitions?: string[];
	examples?: string[];
	contents?: {
		table?: string[][],
		formatted?: object
	};
	translation?: {
		source: {
			language: string;
			text: string;
			pronunciation: string;
		},
		target: {
			language: string,
			text: string,
		}
	};
	currency_converter?: {
		from: {
			price: number;
			currency: string;
		}
		to: {
			price: number;
			currency: string;
		}
	};
	from?: {
		value: number;
		unit: string;
	};
	to?: {
		value: number;
		unit: string;
	};
}

interface KnowledgePanel {
	title: string;
	type: string;
	cite_name: string;
	cite_link: string;
	header_images: string[];
	website: string;
	description?: string;
	source: string;
	born: string;
}