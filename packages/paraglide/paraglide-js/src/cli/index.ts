import { Command } from "commander"
import { compileCommand2 } from "./commands/compile2/command.js"
// import { initCommand2 } from "./commands/init2/command.js"

export const cli = new Command()
	.name("paraglide-js")
	.addCommand(compileCommand2)
	// .addCommand(initCommand2)
	.showHelpAfterError()
	.version(PARJS_PACKAGE_VERSION)

export * as Utils from "./utils.js"
export * as Defaults from "./defaults.js"
