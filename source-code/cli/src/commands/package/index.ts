import { Command } from "commander"
import { build } from "./build/command.js"
import { init } from "./init/command.js"

export const module = new Command()
	.command("package")
	.description("init and build inlang packages")
	.argument("<command>")
	.addCommand(init)
	.addCommand(build)
