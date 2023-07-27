import { addImport, removeImport } from "../../ast-transforms/utils/imports.js"
import { codeToSourceFile, nodeToCode } from "../../ast-transforms/utils/js.util.js"
import type { TransformConfig } from "../vite-plugin/config.js"
import { transformSvelte } from "./_.svelte.js"
import { dedent } from "ts-dedent"
import { isOptOutImportPresent } from "./utils/imports.js"
import { addDataExportIfMissingAndReturnInsertionIndex } from "./utils/exports.js"
import { insertSlotIfEmptyFile, wrapMarkupChildren } from "./utils/markup.js"
import { getSvelteFileParts, markupToAst } from "./utils/svelte.util.js"
import { MagicString } from "../magic-string.js"

export const transformLayoutSvelte = (
	filePath: string,
	config: TransformConfig,
	code: string,
	root: boolean,
) => {
	const fileParts = getSvelteFileParts(code)

	if (isOptOutImportPresent(fileParts)) return code

	if (!root) return transformSvelte(filePath, config, code)

	fileParts.script = transformScript(filePath, config, fileParts.script)
	fileParts.markup = transformMarkup(config, fileParts.markup)

	return transformSvelte(filePath, config, fileParts.toString())
}

// ------------------------------------------------------------------------------------------------

const transformScript = (filePath: string, config: TransformConfig, code: string) => {
	const sourceFile = codeToSourceFile(code, filePath)

	addImport(sourceFile, "@inlang/sdk-js/adapter-sveltekit/client/shared", "addRuntimeToGlobalThis")
	addImport(sourceFile, "@inlang/sdk-js/adapter-sveltekit/shared", "getRuntimeFromData")
	addImport(
		sourceFile,
		`@inlang/sdk-js/adapter-sveltekit/client/${
			config.languageInUrl ? "not-reactive" : "reactive-workaround"
		}`,
		"addRuntimeToContext",
		"getRuntimeFromContext",
	)
	addImport(sourceFile, "$app/environment", "browser")

	// remove imports to avoid conflicts, those imports get added in a reactive way
	removeImport(sourceFile, "@inlang/sdk-js", "i", "languageTag")

	const index = addDataExportIfMissingAndReturnInsertionIndex(sourceFile)

	// TODO: add `addRuntimeToGlobalThis` code only if needed
	sourceFile.insertStatements(
		index + 1,
		dedent`
			$: if (browser) {
				addRuntimeToGlobalThis(getRuntimeFromData(data))
				addRuntimeToContext(getRuntimeFromData(data))
				;({ i, languageTag } = getRuntimeFromContext())
				document.body.parentElement?.setAttribute('lang', language)
			}
		`,
	)

	sourceFile.insertStatements(
		index + 1,
		dedent`
			addRuntimeToGlobalThis(getRuntimeFromData(data))
			addRuntimeToContext(getRuntimeFromData(data))
			let { i, languageTag } = getRuntimeFromContext()
		`,
	)

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

	wrapMarkupChildren(s, ast, "{#key languageTag}$$_INLANG_WRAP_$${/key}")

	const markup1 = s.toString()
	const s1 = new MagicString(markup1)
	// const ast1 = markupToAst(markup1)
	// TODO: only insert if reactive stores are not used
	// TODO: check what to do with `routing.exclude` option
	// if (!config.languageInUrl) {
	// wrapMarkupChildren(s1, ast1, "{#if languageTag}$$_INLANG_WRAP_$${/if}")
	// }

	return s1.toString()
}
