import { assertNoImportsFromSdkJs } from '../../ast-transforms/assertions.js'
import { codeToSourceFile } from '../../ast-transforms/utils/js.util.js'
import type { TransformConfig } from '../vite-plugin/config.js'

// TODO!!: we probably need to add the runtime to globalThis
export const transformJs = (filePath: string, config: TransformConfig, code: string) => {
	const sourceFile = codeToSourceFile(code, filePath)

	assertNoImportsFromSdkJs(sourceFile, filePath.replace(config.cwdFolderPath, ''))

	return code
}
