import { getRuntimeFromContext } from "@inlang/sdk-js/adapter-sveltekit/client/not-reactive"

export const clientFn = () => {
	const { i } = getRuntimeFromContext()
	console.info("utils/client.ts", i("welcome"))
}
