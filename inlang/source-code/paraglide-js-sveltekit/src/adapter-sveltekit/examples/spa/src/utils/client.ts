import { get } from "svelte/store"
import { getRuntimeFromContext } from "@inlang/paraglide-js-sveltekit/adapter-sveltekit/client/reactive"

export const clientFn = () => {
	const { i } = getRuntimeFromContext()
	console.info("utils/client.ts", get(i)("welcome"))
}
