import { Command } from "commander"
import { compileCommand } from "~/cli/commands/compile/command.js"
import { initCommand } from "~/cli/commands/init/command.js"

export const cli = new Command()
	.name("paraglide-js")
	.addCommand(compileCommand)
	.addCommand(initCommand)
	.showHelpAfterError()
	.version(PACKAGE_VERSION)

export * as Utils from "./utils.js"
export * as Defaults from "./defaults.js"
export * as Steps from "./steps.js"
