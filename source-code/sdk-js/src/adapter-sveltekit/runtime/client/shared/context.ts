import { getContext } from "svelte"
import { inlangSymbol } from "../../shared/utils.js"
import { InlangSdkException } from '../../../vite-plugin/exceptions.js'

export const getRuntimeFromContext = () => {
	if (import.meta.env.PROD) {
		return getContext(inlangSymbol)
	}

	// Showing the technical error message does only make sense in development
	// and saves a few bytes from the production bundle
	try {
		return getContext(inlangSymbol)
	} catch (e) {
		throw new InlangSdkException(
			`You cannot directly access any '@inlang/sdk-js' imports in this scope.
Please read the docs for more information on how to workaround this temporary limitation:
https://inlang.com/documentation/sdk/sveltekit-advanced`,
			e as Error,
		)
	}
}
