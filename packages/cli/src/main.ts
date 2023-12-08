import { Command } from "commander"
import { machine } from "./commands/machine/index.js"
import { module } from "./commands/module/index.js"
import { version } from "../package.json"
import consola, { Consola } from "consola"
import { initErrorMonitoring } from "./services/error-monitoring/implementation.js"
import { open } from "./commands/open/index.js"
import { gitOrigin, telemetry } from "./services/telemetry/implementation.js"
import fetchPolyfill from "node-fetch"
import { lint } from "./commands/lint/index.js"
import { validate } from "./commands/validate/index.js"
// --------------- INIT ---------------

// polyfilling node < 18 with fetch
// see https://github.com/osmosis-labs/osmosis-frontend/pull/1575#pullrequestreview-1434480086
if (typeof fetch === "undefined") {
	globalThis.fetch = fetchPolyfill as any
}

initErrorMonitoring()
// checks whether the gitOrigin corresponds to the pattern
// beautiful logging
;(consola as unknown as Consola).wrapConsole()

// --------------- CLI ---------------

export const cli = new Command()
	// Settings
	.name("inlang")
	.version(version)
	.description("CLI for inlang.")
	// Commands
	.addCommand(validate)
	.addCommand(lint)
	.addCommand(machine)
	.addCommand(open)
	.addCommand(module)
	// Hooks
	.hook("postAction", (command) => {
		// name enables better grouping in the telemetry dashboard
		const name = command.args.filter(
			// shouldn't start with a flag and the previous arg shouldn't be a flag
			(arg, i) => !arg.startsWith("-") && !command.args[i - 1]?.startsWith("-")
		)

		telemetry.capture({
			event: `CLI command executed`,
			properties: {
				name: name.join(" "),
				args: command.args.join(" "),
			},
		})
		telemetry.shutdown()
		// https://github.com/tj/commander.js/issues/1745
		process.exit(0)
	})

// --------------- TELEMETRY ---------------

// not using await to not block the CLI

telemetry.capture({
	event: "CLI started",
	properties: {
		version,
	},
})
telemetry.groupIdentify({
	groupType: "repository",
	groupKey: gitOrigin,
	properties: {
		name: gitOrigin,
	},
})
