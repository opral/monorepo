import { Command } from "commander"
import { compileCommand } from "./commands/compile/command.js"
import { initCommand } from "./commands/init/command.js"
import { version } from "./state.js"

export const cli = new Command()
	.name("paraglide-js")
	.addCommand(compileCommand)
	.addCommand(initCommand)
	.showHelpAfterError()
	.version(version)
