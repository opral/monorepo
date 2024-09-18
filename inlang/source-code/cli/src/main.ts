import { Command } from "commander"
import { machine } from "./commands/machine/index.js"
import { module } from "./commands/module/index.js"
import { version } from "../package.json"
// import consola, { Consola } from "consola"
import { initErrorMonitoring } from "./services/error-monitoring/implementation.js"
import { open } from "./commands/open/index.js"
import { lint } from "./commands/lint/index.js"
import { validate } from "./commands/validate/index.js"
import { capture } from "./telemetry/capture.js"
import { lastUsedProject } from "./utilities/getInlangProject.js"

// --------------- INIT ---------------

initErrorMonitoring()
// checks whether the gitOrigin corresponds to the pattern

// beautiful logging
// ;(consola as unknown as Consola).wrapConsole()

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
	.hook("postAction", async (command) => {
		// name enables better grouping in the telemetry dashboard
		const name = command.args.filter(
			// shouldn't start with a flag and the previous arg shouldn't be a flag
			(arg, i) => !arg.startsWith("-") && !command.args[i - 1]?.startsWith("-")
		)

		await capture({
			event: `CLI command executed`,
			projectId: lastUsedProject?.id,
			properties: {
				name: name.join(" "),
				args: command.args.join(" "),
				node_version: process.versions.node,
				platform: process.platform,
				version,
			},
		})
		// process should exit by itself once promises are resolved
	})
