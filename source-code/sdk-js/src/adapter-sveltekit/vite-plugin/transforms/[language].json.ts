import { addImport, isOptOutImportPresent } from '../../../utils/ast/imports.js'
import { codeToSourceFile, nodeToCode } from '../../../utils/utils.js'
import type { TransformConfig } from "../config.js"
import { findExport } from '../../../utils/ast/exports.js'
import { assertNoImportsFromSdkJs } from '../../../utils/ast/assertions.js'

const exportPrerenderNode = codeToSourceFile(`
	export const prerender = true
`).getStatements()[0]!

const exportGetNode = codeToSourceFile(`
	export const GET = async ({ params: { language } }) => {
		await reloadResources()
		return json(getResource(language) || null)
	}
`).getStatements()[0]!

// TODO: check if relative path is correct
const exportEntriesNode = codeToSourceFile(`
	export const entries = async () => {
		const { languages } = await initState(await import('../../../../inlang.config.js'))

		return languages.map(language => ({ language }))
	}
`).getStatements()[0]!

// ------------------------------------------------------------------------------------------------

export const transformLanguageJson = (filePath: string, config: TransformConfig, code: string) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code

	assertNoImportsFromSdkJs(sourceFile, filePath.replace(config.cwdFolderPath, '')) // TODO: implement functionality

	if (findExport(sourceFile, 'GET'))
		throw Error(`The file already contains a 'GET' export.`)

	let codeToInsert = ''
	if (config.isStatic && config.inlang.sdk.resources.cache === "build-time")
		// TODO: find out how to insert it correctly
		codeToInsert += exportPrerenderNode.getText()

	// TODO: find out how to insert it correctly
	codeToInsert += exportGetNode.getText()

	if (config.svelteKit.version || "" >= "1.16.3") {
		// TODO: find out how to insert it correctly
		codeToInsert += exportEntriesNode.getText()

		addImport(sourceFile, "@inlang/sdk-js/adapter-sveltekit/server", "initState")
	}

	addImport(sourceFile, "@inlang/sdk-js/adapter-sveltekit/server", "getResource", "reloadResources")
	addImport(sourceFile, "@sveltejs/kit", "json")

	sourceFile.insertText(sourceFile.getText().length, codeToInsert)

	return nodeToCode(sourceFile)
}
