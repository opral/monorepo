import { InlangSdkException } from "../../../vite-plugin/exceptions.js"
import { inlangSymbol, type ObjectWithClientRuntime } from "../../shared/utils.js"
import type { SvelteKitClientRuntime } from "../runtime.js"

export const getRuntimeFromGlobalThis = (): SvelteKitClientRuntime => {
	if (import.meta.env.DEV) {
		// Showing the technical error message does only make sense in development
		// and saves a few bytes from the production bundle
		const runtime = (globalThis as unknown as ObjectWithClientRuntime)[inlangSymbol]
		if (!runtime) {
			throw new InlangSdkException(
				`You cannot directly access any '@inlang/paraglide-js-sveltekit' imports in this scope.
Please read the docs for more information on how to workaround this temporary limitation:
https://inlang.com/documentation/sdk/sveltekit/advanced`,
			)
		}
	}

	return (globalThis as unknown as ObjectWithClientRuntime)[inlangSymbol]
}

export const addRuntimeToGlobalThis = (context: SvelteKitClientRuntime) =>
	((globalThis as unknown as ObjectWithClientRuntime)[inlangSymbol] = context)
