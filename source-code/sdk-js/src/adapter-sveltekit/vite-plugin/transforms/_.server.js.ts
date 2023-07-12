import { assertNoImportsFromSdkJs } from '../../../utils/ast/assertions.js'
import { codeToSourceFile } from '../../../utils/utils.js'
import type { TransformConfig } from "../config.js"

export const transformServerJs = (filePath: string, config: TransformConfig, code: string) => {
	const sourceFile = codeToSourceFile(code, filePath)

	assertNoImportsFromSdkJs(sourceFile, filePath.replace(config.cwdFolderPath, ''))

	return code
}
