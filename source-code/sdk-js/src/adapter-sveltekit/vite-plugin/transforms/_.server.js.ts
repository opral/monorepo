import { assertNoImportsFromSdkJs } from '../../../utils/ast/assertions.js'
import { codeToSourceFile } from '../../../utils/utils.js'
import type { TransformConfig } from "../config.js"

export const transformServerJs = (config: TransformConfig, code: string) => {
	const sourceFile = codeToSourceFile(code)

	assertNoImportsFromSdkJs(sourceFile)
}
