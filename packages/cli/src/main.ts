import { Command } from "commander"
import { config } from "./commands/config/index.js"
import { machine } from "./commands/machine/index.js"
import { version } from "../package.json"
import consola, { Consola } from "consola"
import { initErrorMonitoring } from "./services/error-monitoring/implementation.js"
import { open } from "./commands/open/index.js"
import { telemetry } from "./services/telemetry/implementation.js"
import { getGitOrigin } from "./utilities/getGitOrigin.js"
import fetchPolyfill from "node-fetch"

// --------------- INIT ---------------

// polyfilling node < 18 with fetch
// see https://github.com/osmosis-labs/osmosis-frontend/pull/1575#pullrequestreview-1434480086
if (typeof fetch === "undefined") {
	globalThis.fetch = fetchPolyfill as any
}

initErrorMonitoring()
const gitOrigin = await getGitOrigin()
console.log(gitOrigin)
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
			groups: { repository: gitOrigin! },
			event: `CLI command executed`,
			properties: {
				args: command.args.join(" "),
				gitOrigin,
			},
		})
	})

// --------------- TELEMETRY ---------------

// not using await to not block the CLI

telemetry.capture({
	distinctId: "unknown",
	groups: { repository: gitOrigin! },
	event: "CLI started",
	properties: {
		version,
		gitOrigin,
	},
})
