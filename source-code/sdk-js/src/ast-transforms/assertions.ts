import type { SourceFile } from 'ts-morph'
import { isSdkImportPresent } from './utils/imports.js'
import { dedent } from 'ts-dedent'
import { InlangSdkException } from '../adapter-sveltekit/vite-plugin/exceptions.js'

// TODO: test
// TODO!!: link to correct section of docs
export const assertNoImportsFromSdkJs = (sourceFile: SourceFile, filePath: string) => {
	if (isSdkImportPresent(sourceFile)) {
		throw new InlangSdkException(dedent`
			It is currently not supported to import something from '@inlang/sdk-js' in this file (${filePath.slice(1)}).
			Please read the docs for more information on how to workaround this temporary limitation:
			https://inlang.com/documentation/sdk/sveltekit-advanced
		`)
	}
}