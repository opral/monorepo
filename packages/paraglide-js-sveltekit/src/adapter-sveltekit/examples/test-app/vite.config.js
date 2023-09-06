import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig } from "vite"
import inlangPlugin from "@inlang/paraglide-js-sveltekit/adapter-sveltekit"

export default defineConfig({
	plugins: [inlangPlugin(), sveltekit()],
})
