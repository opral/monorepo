import { Command } from "commander"
import { validate } from "./validate.js"

export const project = new Command()
	.command("project")
	.description("Commands for managing your inlang project")
	.argument("[command]")
	.addCommand(validate)
