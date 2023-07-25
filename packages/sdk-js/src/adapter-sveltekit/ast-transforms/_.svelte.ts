import type { SourceFile } from "ts-morph"
import { dedent } from "ts-dedent"
import {
	findImportDeclarations,
	addImport,
	removeImport,
	isSdkImportPresent,
	getImportSpecifiersAsStrings,
} from "../../ast-transforms/utils/imports.js"
import { codeToSourceFile, nodeToCode } from "../../ast-transforms/utils/js.util.js"
import type { TransformConfig } from "../vite-plugin/config.js"
import { isOptOutImportPresent } from "./utils/imports.js"
import { getSvelteFileParts, type SvelteFileParts } from "./utils/svelte.util.js"

export const transformSvelte = (
	filePath: string,
	config: TransformConfig,
	code: string,
): string => {
	const fileParts = getSvelteFileParts(code)

	if (isOptOutImportPresent(fileParts)) return code

	transform(filePath, config, fileParts)

	return fileParts.toString()
}
// TODO: what if both script tags import different variables?

const transform = (filePath: string, config: TransformConfig, fileParts: SvelteFileParts) => {
	fileParts.script = transformScriptTag(filePath, config, fileParts.script)
	fileParts.moduleScript = transformScriptTag(filePath, config, fileParts.moduleScript)
}

const transformScriptTag = (filePath: string, config: TransformConfig, script: string) => {
	const sourceFile = codeToSourceFile(script, filePath)

	transformSdkImports(config, sourceFile)

	return nodeToCode(sourceFile)
}

const transformSdkImports = (config: TransformConfig, sourceFile: SourceFile) => {
	if (!isSdkImportPresent(sourceFile)) return

	addImport(
		sourceFile,
		`@inlang/sdk-js/adapter-sveltekit/client/${
			config.languageInUrl ? "not-reactive" : "reactive-workaround"
		}`,
		"getRuntimeFromContext",
	)

	const imports = getImportSpecifiersAsStrings(sourceFile, "@inlang/sdk-js")

	const importDeclarations = findImportDeclarations(sourceFile, "@inlang/sdk-js")

	importDeclarations[0]!.replaceWithText(dedent`
		const { ${imports} } = getRuntimeFromContext()
	`)

	removeImport(sourceFile, "@inlang/sdk-js")
}
