import {
	addImport,
	findImportDeclarations,
	getImportSpecifiers,
	removeImport,
} from "../../ast-transforms/utils/imports.js"
import { codeToSourceFile, nodeToCode } from "../../ast-transforms/utils/js.util.js"
import type { TransformConfig } from "../vite-plugin/inlang-app.js"
import { transformSvelte } from "./_.svelte.js"
import { dedent } from "ts-dedent"
import { isOptOutImportPresent } from "./utils/imports.js"
import { addOrMoveDataExportAndReturnIndex } from "./utils/exports.js"
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
		config.options.languageInUrl ? "not-reactive" : "reactive-workaround"
		}`,
		"addRuntimeToContext",
		"getRuntimeFromContext",
	)
	addImport(sourceFile, "$app/environment", "browser")

	// remove imports to avoid conflicts, those imports get added in a reactive way
	removeImport(sourceFile, "@inlang/sdk-js", "i", "languageTag", "sourceLanguageTag")

	const index = addOrMoveDataExportAndReturnIndex(sourceFile)

	// TODO: add `addRuntimeToGlobalThis` code only if needed
	sourceFile.insertStatements(
		index + 1,
		dedent`
			$: if (browser) {
				addRuntimeToGlobalThis(getRuntimeFromData(data))
				addRuntimeToContext(getRuntimeFromData(data))
				;({ i, languageTag } = getRuntimeFromContext())
				document.body.parentElement?.setAttribute('lang', languageTag)
			}
		`,
	)

	const insertedStatements = sourceFile.insertStatements(
		index + 1,
		dedent`
			addRuntimeToGlobalThis(getRuntimeFromData(data))
			addRuntimeToContext(getRuntimeFromData(data))
			const { sourceLanguageTag } = getRuntimeFromContext()
			let { i, languageTag } = getRuntimeFromContext()
		`,
	)

	// move @inlang/sdk-js import declarations below inserted code
	const imports = findImportDeclarations(sourceFile, "@inlang/sdk-js")
	for (const importDeclaration of imports) {
		importDeclaration.setOrder(insertedStatements.at(-1)!.getChildIndex() + 1)
	}

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
	const ast1 = markupToAst(markup1)
	// TODO: only insert `if (languageTag)` reactive stores are not used
	if (!config.options.languageInUrl) {
		wrapMarkupChildren(s1, ast1, "{#if languageTag || !sourceLanguageTag}$$_INLANG_WRAP_$${/if}")
	}

	return s1.toString()
}
