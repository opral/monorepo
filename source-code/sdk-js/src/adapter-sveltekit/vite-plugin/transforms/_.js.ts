import type { TransformConfig } from "../config.js"
import { assertNoImportsFromSdkJs } from '../../../utils/ast/assertions.js'
import { codeToSourceFile } from '../../../utils/utils.js'

export const transformJs = (config: TransformConfig, code: string) => {
	const sourceFile = codeToSourceFile(code)

	assertNoImportsFromSdkJs(sourceFile)
}
