import { assertNoImportsFromSdkJs } from "../../ast-transforms/assertions.js"
import { addImport, isOptOutImportPresent } from "../../ast-transforms/utils/imports.js"
import { wrapExportedFunction } from "../../ast-transforms/utils/wrap.js"
import { codeToSourceFile, nodeToCode } from "../../ast-transforms/utils/js.util.js"
import type { TransformConfig } from "../vite-plugin/config.js"
import { filePathForOutput } from "../vite-plugin/fileInformation.js"

export const transformLayoutServerJs = (
	filePath: string,
	config: TransformConfig,
	code: string,
	root: boolean,
) => {
	const sourceFile = codeToSourceFile(code, filePath)

	if (isOptOutImportPresent(sourceFile)) return code

	assertNoImportsFromSdkJs(sourceFile, filePathForOutput(config, filePath), "+layout.server.js") // TODO: implement functionality

	if (!root) return code // for now we don't need to transform non-root files

	const wrapperFunctionName = root ? "initRootLayoutServerLoadWrapper" : "initServerLoadWrapper"

	addImport(sourceFile, "@inlang/sdk-js/adapter-sveltekit/server", wrapperFunctionName)

	wrapExportedFunction(sourceFile, undefined, wrapperFunctionName, "load")

	return nodeToCode(sourceFile)
}
