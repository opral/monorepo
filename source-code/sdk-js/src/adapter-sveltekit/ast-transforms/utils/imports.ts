import type { SvelteFileParts } from './svelte.util.js'
import { codeToSourceFile } from '../../../ast-transforms/utils/js.util.js'
import { isOptOutImportPresent as isOptOutImportPresentOriginal, isSdkImportPresent as isSdkImportPresentOriginal } from '../../../ast-transforms/utils/imports.js'

// TODO: test
export const isOptOutImportPresent = ({ script, moduleScript }: SvelteFileParts) => {
	const scriptSourceFile = codeToSourceFile(script)
	if (isOptOutImportPresentOriginal(scriptSourceFile)) return true

	const moduleScriptSourceFile = codeToSourceFile(moduleScript)
	if (isOptOutImportPresentOriginal(moduleScriptSourceFile)) return true

	return false
}

// ------------------------------------------------------------------------------------------------

// TODO: test
export const isSdkImportPresent = ({ script, moduleScript }: SvelteFileParts) => {
	const scriptSourceFile = codeToSourceFile(script)
	if (isSdkImportPresentOriginal(scriptSourceFile)) return true

	const moduleScriptSourceFile = codeToSourceFile(moduleScript)
	if (isSdkImportPresentOriginal(moduleScriptSourceFile)) return true

	return false
}