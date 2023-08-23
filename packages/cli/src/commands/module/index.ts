import { Command } from "commander"
import { build } from "./build/command.js"

export const module = new Command()
	.command("module")
	.description("Commands related to inlang modules.")
	.argument("<command>")
	.addCommand(build)
