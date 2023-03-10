import { Command } from "commander"
import prompts from "prompts"

export const init = new Command()
	.command("init")
	.description("Initialize the inlang.config.js file.")
	.action(async () => {
		const response1 = await prompts({
			type: "autocomplete",
			name: "format",
			initial: "fluent",
			message: "What file format is or will be used for translations in this project?",
			choices: [
				{ title: "fluent", value: "fluent" },
				{ title: "json", value: "json" },
			],
		})
		console.log(response1)
	})
