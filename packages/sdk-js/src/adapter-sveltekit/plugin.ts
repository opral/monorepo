import { createUnplugin } from "unplugin"

const unplugin = createUnplugin(() => {
	return {
		name: "inlang-sveltekit-adapter",
		buildStart() {
			console.log("Here comes some inlang magic")
		},
	}
})

export const vitePlugin = unplugin.vite
export const rollupPlugin = unplugin.rollup
