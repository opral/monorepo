import { Command } from "commander"
import { initCommand } from "./commands/inits.js"

export const cli = new Command()
	.name("paraglide-sveltekit")
	.addCommand(initCommand)
	.showHelpAfterError()
	.version("0.7.0")
