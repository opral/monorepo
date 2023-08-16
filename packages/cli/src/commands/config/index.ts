import { Command } from "commander"
import { init } from "./init.js"
import { validate } from "./validate.js"

export const config = new Command()
	.command("config")
	.description("Commands for managing the config file.")
	.argument("<command>")
	.addCommand(init)
	.addCommand(validate)
