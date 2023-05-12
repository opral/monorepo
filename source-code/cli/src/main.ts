import { Command } from "commander"
import { config } from "./commands/config/index.js"
import { version } from "../package.json"
import consola, { Consola } from "consola"
import { initErrorMonitoring } from "./services/error-monitoring/implementation.js"

initErrorMonitoring()

// beautiful logging
;(consola as unknown as Consola).wrapConsole()

export const cli = new Command()
	.name("inlang")
	.version(version)
	.description("CLI for inlang.")
	.addCommand(config)
