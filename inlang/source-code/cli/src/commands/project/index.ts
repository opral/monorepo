import { Command } from "commander"
import { init } from "./init.js"
import { migrate } from "./migrate.js"
import { validate } from "./validate.js"

export const project = new Command()
	.command("project")
	.description("Commands for managing your inlang project")
	.argument("[command]")
	.addCommand(init)
	.addCommand(validate)
	.addCommand(migrate)
