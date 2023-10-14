import { loadProject, type InlangProject } from "@inlang/sdk"
import consola from "consola"
import dedent from "dedent"
import type minimist from "minimist"
import { compile } from "../../compiler/compile.js"
import fs from "node:fs/promises"
import { resolve } from "node:path"

const compileCommandUsage = dedent`
Usage: paraglide-js compile <project-path>
Example: paraglide-js compile ./project.inlang.json
`

export const runCompileCommand = async (args: {
	argv: minimist.ParsedArgs
	paraglideDirectory: string
}) => {
	const projectPath = args.argv._[1]

	if (projectPath === undefined) {
		consola.error(`No project path specified.\n\n${compileCommandUsage}`)
		process.exit(1)
	}

	consola.info(`Compiling inlang project at "${projectPath}".`)

	const project = exitIfErrors(
		await loadProject({ settingsFilePath: resolve(process.cwd(), projectPath), nodeishFs: fs })
	)

	const output = compile({
		messages: project.query.messages.getAll(),
		settings: project.settings(),
	})

	for (const [fileName, fileContent] of Object.entries(output)) {
		// create the compiled-output directory if it doesn't exist
		await fs.access(`${args.paraglideDirectory}/dist/compiled-output`).catch(async () => {
			await fs.mkdir(`${args.paraglideDirectory}/dist/compiled-output`)
		})
		await fs.writeFile(`${args.paraglideDirectory}/dist/compiled-output/${fileName}`, fileContent, {
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
		// two console statements for better output formatting
		// because project.errors() internal .toString() method
		// is better than manual processing.
		consola.error(`The project has errors:`)
		consola.log(project.errors())
		process.exit(1)
	}
	return project
}
