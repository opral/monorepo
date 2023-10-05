import consola from "consola"
import minimist from "minimist"
import { loadProject, type InlangProject } from "@inlang/sdk"
import dedent from "dedent"
import fs from "node:fs/promises"
import type { CompileFunction } from "./types.js"
import { fileURLToPath } from "node:url"

/**
 * The path this code is executed from.
 */
const metaUrlPath = fileURLToPath(import.meta.url)

/**
 * The path to the package directory.
 *
 * slices a path
 * from '/Users/samuel/example/repository/node_modules/paraglide-js/dist/cli/main.js'
 * to   '/Users/samuel/example/repository/node_modules/paraglide-js'
 */
const packageDirectory = metaUrlPath.slice(0, metaUrlPath.indexOf("/dist/"))

/**
 * The CLI entry point.
 *
 * Pass the compile function for framework specific adjustments.
 */
export const cli = async (args: { compile: CompileFunction; name: string }) => {
	// ------------------- VALIDATE IF RUNNING FROM CORRECT FOLDER -------------------
	// the CLI expects to be running from the dist folder of the specific paraglide package
	// to compile the output in the correct directory
	if (metaUrlPath.includes(`${args.name}/dist/`) === false) {
		consola.error(
			dedent`
			The CLI is not running from the dist folder. 

			This is likely an internal bug. Please file an issue at https://github.com/inlang/monorepo/issues.

			Debug information: 

			- name: ${args.name}
			- metaUrlPath: ${metaUrlPath}
			`
		)
		process.exit(1)
	}

	const usage = dedent`
	Available commands: 

	compile - Compiles an inlang project into the importable paraglide-js library. 
	`

	// the first two arguments are the node binary and the script path
	const argv = minimist(process.argv.slice(2))

	const commandName = argv._[0]

	switch (commandName) {
		case "compile":
			return runCompileCommand({ compile: args.compile, name: args.name, argv })
		default:
			return (() => {
				consola.error(`Unknown command "${commandName}"\n\n${usage}`)
				process.exit(1)
			})()
	}
}

const runCompileCommand = async (args: {
	argv: minimist.ParsedArgs
	name: string
	compile: CompileFunction
}) => {
	const usage = dedent`
	Usage: ${args.name} compile <project-path>
	Example: ${args.name} compile ./project.inlang.json
	`

	const projectPath = args.argv._[1]

	if (projectPath === undefined) {
		consola.error(`No project path specified.\n\n${usage}`)
		process.exit(1)
	}

	consola.info(`Compiling inlang project at "${projectPath}".`)

	const project = exitIfErrors(await loadProject({ settingsFilePath: projectPath, nodeishFs: fs }))

	const output = args.compile({
		messages: project.query.messages.getAll(),
		settings: project.settings(),
	})

	for (const [fileName, fileContent] of Object.entries(output)) {
		await fs.writeFile(`${packageDirectory}/dist/compiled-output/${fileName}`, fileContent, {
			encoding: "utf-8",
		})
	}

	consola.success("Successfully compiled the project.")
}

/**
 * Utility function to exit when the project has errors.
 */
const exitIfErrors = (project: InlangProject) => {
	if (project.errors().length > 0) {
		consola.error(dedent`
    The project at has errors:

    ${project.errors().join("\n")}
    `)
		process.exit(1)
	}
	return project
}