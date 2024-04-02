import { Command } from "commander"
import { compileCommand } from "./commands/compile.js"
import InitCommand from "./commands/init/index.js"
import { version } from "./state.js"

export const cli = new Command()
	.name("paraglide-js")
	.addCommand(compileCommand)
	.addCommand(InitCommand)
	.showHelpAfterError()
	.version(version)
