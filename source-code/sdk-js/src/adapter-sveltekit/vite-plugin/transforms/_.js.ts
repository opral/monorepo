import type { TransformConfig } from "../config.js"
import { assertNoImportsFromSdkJs } from '../../../utils/ast/assertions.js'
import { codeToSourceFile } from '../../../utils/js.util.js'

// TODO: we probably need to add the runtime to globalThis
export const transformJs = (filePath: string, config: TransformConfig, code: string) => {
	const sourceFile = codeToSourceFile(code, filePath)

	assertNoImportsFromSdkJs(sourceFile, filePath.replace(config.cwdFolderPath, ''))

	return code
}
