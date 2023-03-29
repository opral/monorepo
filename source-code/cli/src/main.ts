import { Command } from "commander"
import { config } from "./commands/config/index.js"
import { version } from "../package.json"

export const cli = new Command()
	.name("inlang")
	.version(version)
	.description("CLI for inlang.")
	.addCommand(config)
