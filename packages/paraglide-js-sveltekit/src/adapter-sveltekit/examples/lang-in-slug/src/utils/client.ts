import { getRuntimeFromContext } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/not-reactive"

export const clientFn = () => {
	const { i } = getRuntimeFromContext()
	console.info("utils/client.ts", i("welcome"))
}
