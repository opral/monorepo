import { Command } from "commander"
import { initCommand } from "./commands/init/command.js"
import { compileCommand2 } from "./commands/compile2/command.js"

export const cli = new Command()
	.name("paraglide-js")
	.addCommand(compileCommand2)
	.addCommand(initCommand)
	.showHelpAfterError()
	.version(PARJS_PACKAGE_VERSION)

export * as Utils from "./utils.js"
export * as Defaults from "./defaults.js"
export * as Steps from "./steps.js"
