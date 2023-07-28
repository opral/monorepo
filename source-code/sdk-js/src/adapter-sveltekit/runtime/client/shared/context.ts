import { getContext, setContext } from "svelte"
import { inlangSymbol } from "../../shared/utils.js"
import { InlangSdkException } from "../../../vite-plugin/exceptions.js"

export const getRuntimeFromContext = () => {
	if (import.meta.env.DEV) {
		// Showing the technical error message does only make sense in development
		// and saves a few bytes from the production bundle
		try {
			return getContext(inlangSymbol)
		} catch (error) {
			throw new InlangSdkException(
				`You cannot directly access any '@inlang/sdk-js' imports in this scope.
Please read the docs for more information on how to workaround this temporary limitation:
https://inlang.com/documentation/sdk/sveltekit/advanced`,
				error as Error,
			)
		}
	}

	return getContext(inlangSymbol)
}

export const addRuntimeToContext = <RuntimeContext>(context: RuntimeContext) =>
	setContext<RuntimeContext>(inlangSymbol, context)
