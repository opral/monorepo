import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
// @ts-ignore
import { vitePlugin } from "@inlang/sdk-js/adapter-sveltekit"

export default defineConfig({
	plugins: [sveltekit(), vitePlugin()]
});
