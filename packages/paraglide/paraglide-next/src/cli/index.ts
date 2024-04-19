import { Command } from "commander"
import { InitCommand } from "./commands/init.js"
import { i18nCommand } from "./commands/i18n.js"

export const cli = new Command()
	.version(PARAGLIDE_NEXT_VERSION)
	.addCommand(InitCommand)
	.addCommand(i18nCommand)
