import { Command } from "commander"
import { config } from "./commands/config/index.js"

if (process.env.PACKAGE_VERSION === undefined) {
	throw Error("Env varibales do not contain package version." + JSON.stringify(process.env))
}

export const cli = new Command()
	.name("inlang")
	.version(process.env.PACKAGE_VERSION)
	.description("CLI for inlang.")
	.addCommand(config)
