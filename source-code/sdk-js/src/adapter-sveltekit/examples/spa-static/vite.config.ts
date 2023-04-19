import { sveltekit } from "@sveltejs/kit/vite"
import { defineConfig, type PluginOption } from "vite"
import { rollupPlugin } from "@inlang/sdk-js/adapter-sveltekit"

export default defineConfig({
	plugins: [sveltekit() as PluginOption, rollupPlugin() as PluginOption],
})
