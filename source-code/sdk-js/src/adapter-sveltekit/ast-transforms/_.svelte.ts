import type { SourceFile } from "ts-morph"
import { dedent } from "ts-dedent"
import {
	findImportDeclarations,
	getImportSpecifiers,
	addImport,
	removeImport,
	isSdkImportPresent,
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

	const importDeclarations = findImportDeclarations(sourceFile, "@inlang/sdk-js")
	const importSpecifiers = []
	for (const importDeclaration of importDeclarations) {
		importSpecifiers.push(...getImportSpecifiers(importDeclaration))
	}

	addImport(
		sourceFile,
		`@inlang/sdk-js/adapter-sveltekit/client/${
			config.languageInUrl ? "not-reactive" : "reactive-workaround"
		}`,
		"getRuntimeFromContext",
	)

	const imports = importSpecifiers.map((importSpecifier) =>
		importSpecifier.getText().replace("as", ":"),
	)

	importDeclarations[0]!.replaceWithText(dedent`
		const { ${imports} } = getRuntimeFromContext()
	`)

	removeImport(sourceFile, "@inlang/sdk-js")
}
