import consola from "consola"
import minimist from "minimist"
import dedent from "dedent"
import { fileURLToPath } from "node:url"
import { runCompileCommand } from "./commands/compile.js"

const usage = dedent`
Available commands: 

compile - Compiles an inlang project into the importable paraglide-js library. 
`

/**
 * The path this file is executed from.
 *
 * Usually something like '/Users/samuel/example/repository/node_modules/paraglide-js/dist/cli/main.js'
 */
const metaUrlPath = fileURLToPath(import.meta.url)

/**
 * The absolute path to the paraglide directory.
 *
 * slices a path
 * from '/Users/samuel/example/repository/node_modules/paraglide-js/dist/cli/main.js'
 * to   '/Users/samuel/example/repository/node_modules/paraglide-js'
 */
const paraglideDirectory: string = metaUrlPath.slice(0, metaUrlPath.indexOf("/dist/"))

/**
 * The CLI entry point.
 */
export const main = () => {
	// ------------------- VALIDATE IF RUNNING FROM CORRECT FOLDER -------------------
	// the CLI expects to be running from the dist folder of the specific paraglide package
	// to compile the output in the correct directory
	if (metaUrlPath.includes(`paraglide-js/dist/`) === false) {
		consola.error(
			dedent`
			The CLI is not running from the dist folder. 

			This is likely an internal bug. Please file an issue at https://github.com/inlang/monorepo/issues.

			Debug information: 

			- metaUrlPath: ${metaUrlPath}
			`
		)
		process.exit(1)
	}

	// the first two arguments are the node binary and the script path
	const argv = minimist(process.argv.slice(2))

	const commandName = argv._[0]

	switch (commandName) {
		case "compile":
			return runCompileCommand({ argv, paraglideDirectory })
		default:
			return (() => {
				consola.error(`Unknown command "${commandName}"\n\n${usage}`)
				process.exit(1)
			})()
	}
}
