import consola from "consola"
import minimist from "minimist"
import { type compile } from "../compiler/compile.js"
import dedent from "dedent"
import { loadProject } from "@inlang/sdk"
import fs from "node:fs/promises"

/**
 * The CLI entry point.
 *
 * Pass the compile function for framework specific adjustments.
 */
export const cli = async (args: { compile: typeof compile; name: string }) => {
	// the first two arguments are the node binary and the script path
	const argv = minimist(process.argv.slice(2))

	const usage = dedent`
    Usage: ${args.name} compile <project-path>
    Example: ${args.name} compile ./project.inlang.json
  `

	const commandName = argv._[0]
	const projectPath = argv._[1]

	if (commandName !== "compile") {
		consola.error(`Unknown command "${commandName}"\n\n${usage}`)
		process.exit(1)
	} else if (projectPath === undefined) {
		consola.error(`No project path specified.\n\n${usage}`)
		process.exit(1)
	}

	consola.info(`Compiling inlang project at "${projectPath}".`)

	const project = await loadProject({ settingsFilePath: projectPath, nodeishFs: fs })

	if (project.errors().length > 0) {
		consola.error(dedent`
    The project "${argv.project}" has errors:

    ${project.errors().join("\n")}
    `)
		process.exit(1)
	}

	consola.success("Successfully compiled the project.")
}
