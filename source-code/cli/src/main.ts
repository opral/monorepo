import { Command } from "commander"
// commands
import { init } from "./commands/init.js"

if (process.env.PACKAGE_VERSION === undefined) {
	throw Error("Env varibales do not contain package version." + JSON.stringify(process.env))
}

export const cli = new Command()
	.name("inlang")
	.version(process.env.PACKAGE_VERSION)
	.description("The CLI is in early alpha. Expect changes and new commands down the line.")
	.addCommand(init)
