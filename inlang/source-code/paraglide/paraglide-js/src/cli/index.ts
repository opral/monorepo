import { Command } from "commander"
import { compileCommand } from "./commands/compile/command.js"

export const cli = new Command()
	.name("paraglide-js")
	.addCommand(compileCommand)
	.showHelpAfterError()
	.version(PARJS_PACKAGE_VERSION)

export * as Utils from "./utils.js"
export * as Defaults from "./defaults.js"
