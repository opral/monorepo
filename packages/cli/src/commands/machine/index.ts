import { Command } from "commander"
import { translate } from "./translate.js"

export const machine = new Command()
	.command("machine")
	.description("Commands for automating translations.")
	.argument("<command>")
	.addCommand(translate)
