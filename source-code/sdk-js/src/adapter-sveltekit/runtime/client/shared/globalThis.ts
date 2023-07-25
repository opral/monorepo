import { InlangSdkException } from '../../../vite-plugin/exceptions.js'
import { inlangSymbol } from "../../shared/utils.js"
import type { SvelteKitClientRuntime } from '../runtime.js'

export const getRuntimeFromGlobalThis = (): SvelteKitClientRuntime => {
	if (import.meta.env.DEV) {
		// Showing the technical error message does only make sense in development
		// and saves a few bytes from the production bundle
		const runtime = (globalThis as any)[inlangSymbol]
		if (!runtime) {
			throw new InlangSdkException(
				`You cannot directly access any '@inlang/sdk-js' imports in this scope.
Please read the docs for more information on how to workaround this temporary limitation:
https://inlang.com/documentation/sdk/sveltekit/advanced`
			)
		}
	}

	return (globalThis as any)[inlangSymbol]
}

export const addRuntimeToGlobalThis = (context: SvelteKitClientRuntime) =>
	(globalThis as any)[inlangSymbol] = context