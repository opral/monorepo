import { loadProject, type InlangProject } from "@inlang/sdk"
import consola from "consola"
import { compile } from "../../compiler/compile.js"
import fs from "node:fs/promises"
import { resolve } from "node:path"
import { Command } from "commander"
import { paraglideDirectory } from "../state.js"
import dedent from "dedent"

export const compileCommand = new Command()
	.name("compile")
	.summary("Compiles inlang Paraglide-JS.")
	.requiredOption(
		"--project <path>",
		"The path to the project settings file.",
		"./project.inlang.json"
	)
	.requiredOption(
		"--namespace <name>",
		dedent`
		The import namespace of the compiled library. 
		\nExample: --namespace frontend
		-> import * as m from "@inlang/paraglide-js/frontend/messages"
		\n`
	)
	.action(async (options: { project: string; namespace: string }) => {
		consola.info(`Compiling inlang project at "${options.project}".`)

		const path = resolve(process.cwd(), options.project)

		const project = exitIfErrors(
			await loadProject({
				settingsFilePath: path,
				nodeishFs: fs,
			})
		)

		const output = compile({
			messages: project.query.messages.getAll(),
			settings: project.settings(),
		})

		const outputDirectory =
			`${paraglideDirectory}/dist/compiled-output` +
			(options.namespace ? `/${options.namespace}` : "")

		for (const [fileName, fileContent] of Object.entries(output)) {
			// create the compiled-output directory if it doesn't exist
			await fs.access(outputDirectory).catch(async () => {
				await fs.mkdir(outputDirectory, { recursive: true })
			})
			await fs.writeFile(`${outputDirectory}/${fileName}`, fileContent, {
				encoding: "utf-8",
			})
		}

		consola.success("Successfully compiled the project.")
	})

/**
 * Utility function to exit when the project has errors.
 */
const exitIfErrors = (project: InlangProject) => {
	if (project.errors().length > 0) {
		consola.warn(`The project has errors:`)
		for (const error of project.errors()) {
			consola.error(error)
		}
		process.exit(1)
	}
	return project
}
