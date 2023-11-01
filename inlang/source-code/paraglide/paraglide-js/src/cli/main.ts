import consola from "consola"
import dedent from "dedent"
import { Command } from "commander"
import { compileCommand } from "./commands/compile.js"
import { paraglideDirectory, version } from "./state.js"
import { initCommand } from "./commands/init.js"

export const cli = new Command()
	.name("paraglide-js")
	.addCommand(compileCommand)
	.addCommand(initCommand)
	.showHelpAfterError()
	.version(version)
	.action(() => {
		// ------------------- VALIDATE IF RUNNING FROM CORRECT FOLDER -------------------
		// the CLI expects to be running from the dist folder of the specific paraglide package
		// to compile the output in the correct directory
		if (paraglideDirectory.endsWith(`paraglide-js`) === false) {
			consola.error(
				dedent`
			The CLI is not running from a paraglide-js directory. 

			This is likely an internal bug. Please file an issue at https://github.com/inlang/monorepo/issues.

			Debug information: 

			- paraglideDirectory: ${paraglideDirectory}
			`
			)
			return process.exit(1)
		}
		// show the help because no command is specified
		return cli.help()
	})
