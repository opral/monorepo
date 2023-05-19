import { Command } from "commander"
import { config } from "./commands/config/index.js"
import { machine } from "./commands/machine/index.js"
import { version } from "../package.json"
import consola, { Consola } from "consola"
import { initErrorMonitoring } from "./services/error-monitoring/implementation.js"
import { open } from "./commands/open/index.js"
import { telemetry } from "./services/telemetry/implementation.js"
import { getGitOrigin } from "./utilities/getGitOrigin.js"

// --------------- INIT ---------------

initErrorMonitoring()

const gitOrigin = await getGitOrigin()

// beautiful logging
;(consola as unknown as Consola).wrapConsole()

// --------------- CLI ---------------

export const cli = new Command()
	.name("inlang")
	.version(version)
	.description("CLI for inlang.")
	.addCommand(config)
	.addCommand(machine)
	.addCommand(open)
	.hook("postAction", (command) => {
		telemetry.capture({
			distinctId: "unknown",
			event: `CLI command executed [${command.args.join(" ")}]`,
			properties: {
				gitOrigin,
			},
		})
	})

// --------------- TELEMETRY ---------------

// not using await to not block the CLI

telemetry.capture({
	distinctId: "unknown",
	event: "CLI started",
	properties: {
		version,
		gitOrigin,
	},
})
