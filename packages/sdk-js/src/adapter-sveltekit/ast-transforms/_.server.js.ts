import { assertNoImportsFromSdkJs } from "../../ast-transforms/assertions.js"
import { codeToSourceFile } from "../../ast-transforms/utils/js.util.js"
import type { TransformConfig } from "../vite-plugin/config.js"
import { filePathForOutput } from "../vite-plugin/fileInformation.js"

export const transformServerJs = (filePath: string, config: TransformConfig, code: string) => {
	const sourceFile = codeToSourceFile(code, filePath)

	assertNoImportsFromSdkJs(sourceFile, filePathForOutput(config, filePath), "*.server.js")

	return code
}
