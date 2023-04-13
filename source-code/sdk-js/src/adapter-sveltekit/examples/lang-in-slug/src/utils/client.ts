import { getInlangContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"

export const clientFn = () => {
	const { i } = getInlangContext()
	console.info("utils/client.ts", i("welcome"))
}
