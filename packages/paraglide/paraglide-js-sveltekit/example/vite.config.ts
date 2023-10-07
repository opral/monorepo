import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// for easier debugging, don't minify
	build: {
		minify: false,
	},
})
