import { Command } from "commander"
import { build } from "./build/command.js"

export const module = new Command()
	.command("package")
	.description("Commands related to inlang packages.")
	.argument("<command>")
	.addCommand(build)
