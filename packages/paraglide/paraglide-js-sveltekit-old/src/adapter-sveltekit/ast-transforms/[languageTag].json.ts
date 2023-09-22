import dedent from "dedent"
import { findExport } from "../../ast-transforms/utils/exports.js"
import { addImport, isOptOutImportPresent } from "../../ast-transforms/utils/imports.js"
import { codeToSourceFile, nodeToCode } from "../../ast-transforms/utils/js.util.js"
import type { VirtualModule } from "../vite-plugin/config/index.js"
import { InlangSdkException } from "../vite-plugin/exceptions.js"
import { filePathForOutput } from "../vite-plugin/fileInformation.js"
import { transformServerRequestJs } from "./+server.js.js"

export const transformLanguageJson = (filePath: string, config: VirtualModule, code: string) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code

	const fileName = filePathForOutput(config, filePath)

	if (findExport(sourceFile, "GET"))
		throw new InlangSdkException(dedent`
			The file (${fileName}) already contains a 'GET' export.
			Please remove it as 'inlang' needs to inject it's own magic here.
		`)

	const index = sourceFile.getPos()
	if (config.options.isStatic && config.options.resourcesCache === "build-time")
		sourceFile.insertText(
			index,
			dedent`
				export const prerender = true
			`,
		)

	sourceFile.insertText(
		index,
		dedent`
			export const GET = async ({ params: { languageTag } }) => {
				return json(loadMessages(languageTag) || null)
			}
		`,
	)

	if (config.svelteKit.version || "" >= "1.16.3") {
		addImport(sourceFile, "@inlang/paraglide-js-sveltekit/adapter-sveltekit/server", "initState")

		sourceFile.insertText(
			index,
			dedent`
			export const entries = async () => {
				const { languageTags } = await initState()

				return languageTags.map(languageTag => ({ languageTag }))
			}
		`,
		)
	}

	addImport(sourceFile, "@inlang/paraglide-js-sveltekit/adapter-sveltekit/server", "loadMessages")
	addImport(sourceFile, "@sveltejs/kit", "json")

	return transformServerRequestJs(filePath, config, nodeToCode(sourceFile))
}
