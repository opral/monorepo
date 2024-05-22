import { Command } from "commander"
import { initCommand } from "./commands/inits.js"
import { VERSION } from "svelte/compiler"

export const cli = new Command()
	.name("paraglide-sveltekit")
	.addCommand(initCommand)
	.showHelpAfterError()
	.version(VERSION)
