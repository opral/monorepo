import { Command } from "commander"
import { initCommand } from "./commands/inits.js"
import { PARAGLIDE_SVELTEKIT_VERSION } from "../meta.js"

export const cli = new Command()
	.name("paraglide-sveltekit")
	.addCommand(initCommand)
	.showHelpAfterError()
	.version(PARAGLIDE_SVELTEKIT_VERSION)
