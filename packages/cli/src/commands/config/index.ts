import { Command } from "commander"
import { validate } from "./validate.js"

export const config = new Command()
	.command("config")
	.description("Commands for managing the config file.")
	.argument("<command>")
	.addCommand(validate)
