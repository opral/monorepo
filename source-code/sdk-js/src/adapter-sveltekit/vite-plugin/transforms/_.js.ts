import type { TransformConfig } from "../config.js"
import { assertNoImportsFromSdkJs } from '../../../utils/ast/assertions.js'
import { codeToSourceFile } from '../../../utils/utils.js'

export const transformJs = (filePath: string, config: TransformConfig, code: string) => {
	const sourceFile = codeToSourceFile(code, filePath)

	assertNoImportsFromSdkJs(sourceFile, filePath.replace(config.cwdFolderPath, ''))

	return code
}
