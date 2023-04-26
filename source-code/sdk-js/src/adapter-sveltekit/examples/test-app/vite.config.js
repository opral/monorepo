import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vite"
// @ts-ignore
import { inlangPlugin } from "@inlang/sdk-js/adapter-sveltekit"

export default defineConfig({
	plugins: [inlangPlugin.vite(), sveltekit()],
})
