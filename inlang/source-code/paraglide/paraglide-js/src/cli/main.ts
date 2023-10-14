import consola from "consola"
import dedent from "dedent"
import { fileURLToPath } from "node:url"
import { Command } from "commander"
import { compileCommand } from "./commands/compile.js"

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
export const paraglideDirectory: string = metaUrlPath.slice(0, metaUrlPath.indexOf("/dist/"))

export const cli = new Command()
	.name("paraglide-js")
	.addCommand(compileCommand)
	.hook("preAction", () => {
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
	})

cli.showHelpAfterError(true)
