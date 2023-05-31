import { Command } from "commander"
import { config } from "./commands/config/index.js"
import { machine } from "./commands/machine/index.js"
import { version } from "../package.json"
import consola, { Consola } from "consola"
import { initErrorMonitoring } from "./services/error-monitoring/implementation.js"
import { open } from "./commands/open/index.js"
import { telemetry } from "./services/telemetry/implementation.js"
import { getGitRemotes } from "./utilities/getGitRemotes.js"
import { parseOrigin } from "@inlang/telemetry"
import fetchPolyfill from "node-fetch"
import { lint } from "./commands/lint/index.js"

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
const gitOrigin = parseOrigin({ remotes: await getGitRemotes() })

export const cli = new Command()
	.name("inlang")
	.version(version)
	.description("CLI for inlang.")
	.addCommand(config)
	.addCommand(lint)
	.addCommand(machine)
	.addCommand(open)
	.hook("postAction", (command) => {
		// name enables better grouping in the telemetry dashboard
		const name = command.args.filter(
			// shouldn't start with a flag and the previous arg shouldn't be a flag
			(arg, i) => !arg.startsWith("-") && !command.args[i - 1]?.startsWith("-"),
		)
		telemetry.capture({
			distinctId: "unknown",
			groups: { repository: gitOrigin },
			event: `CLI command executed`,
			properties: {
				name: name.join(" "),
				args: command.args.join(" "),
			},
		})
	})

// --------------- TELEMETRY ---------------

// not using await to not block the CLI

telemetry.capture({
	distinctId: "unknown",
	groups: { repository: gitOrigin },
	event: "CLI started",
	properties: {
		version,
	},
})
