import { Command } from "commander"
import { build } from "./build/command.js"
import { init } from "./init/command.js"

export const module = new Command()
	.command("module")
	.description("Commands for build inlang modules.")
	.argument("[command]")
	.addCommand(init)
	.addCommand(build)
