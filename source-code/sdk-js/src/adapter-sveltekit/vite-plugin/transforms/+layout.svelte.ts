import type { TransformConfig } from "../config.js"
import { isOptOutImportPresent, transformSvelte } from "./_.svelte.js"
import { codeToSourceFile, nodeToCode } from '../../../utils/utils.js'
import { getSvelteFileParts } from '../../../utils/svelte.util.js'
import { MagicString, addDataExportIfMissingAndReturnInsertionIndex, markupToAst, wrapMarkupChildren, insertSlotIfEmptyFile } from '../../../utils/ast/svelte.js'
import { addImport } from '../../../utils/ast/imports.js'
import { dedent } from 'ts-dedent'

export const transformLayoutSvelte = (config: TransformConfig, code: string, root: boolean) => {
	const fileParts = getSvelteFileParts(code)

	if (isOptOutImportPresent(fileParts)) return code

	if (!root) return transformSvelte(config, code)

	fileParts.script = transformScript(config, fileParts.script)
	fileParts.markup = transformMarkup(config, fileParts.markup)

	return transformSvelte(config, fileParts.toString())
}

// ------------------------------------------------------------------------------------------------

const transformScript = (config: TransformConfig, code: string) => {
	const sourceFile = codeToSourceFile(code)

	addImport(sourceFile, '@inlang/sdk-js/adapter-sveltekit/shared', 'getRuntimeFromData')
	addImport(sourceFile, '@inlang/sdk-js/adapter-sveltekit/not-reactive', 'addRuntimeToContext', 'getRuntimeFromContext')
	addImport(sourceFile, '$app/environment', 'browser')

	const index = addDataExportIfMissingAndReturnInsertionIndex(sourceFile)

	sourceFile.insertStatements(index + 1, dedent`
		$: if (browser) {
			addRuntimeToContext(getRuntimeFromData(data))
			;({ i, language } = getRuntimeFromContext())
		}
	`)
	sourceFile.insertStatements(index + 1, dedent`
		addRuntimeToContext(getRuntimeFromData(data))
		let { i, language } = getRuntimeFromContext()
	`)

	return nodeToCode(sourceFile)
}

// ------------------------------------------------------------------------------------------------

const transformMarkup = (config: TransformConfig, markup: string): string => {
	const s = new MagicString(markup)
	const ast = markupToAst(markup)

	const inserted = insertSlotIfEmptyFile(s, ast)
	if (inserted) {
		return transformMarkup(config, s.toString())
	}

	wrapMarkupChildren(s, ast, '{#key $$_INLANG_LANGUAGE_$$}$$_INLANG_WRAP_$${/key}')
	// TODO: only insert if reactive stores are not used
	// if (!config.languageInUrl) {
	wrapMarkupChildren(s, ast, '{#if $$_INLANG_LANGUAGE_$$}$$_INLANG_WRAP_$${/if}')
	// }

	return s.toString()
}
