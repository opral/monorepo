import { Command } from "commander"
import prompts from "prompts"

export const init = new Command()
	.command("init")
	.description("Get up and running by creating the config file.")
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
