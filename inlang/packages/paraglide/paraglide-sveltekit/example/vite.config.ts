import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { paraglideSveltekit } from '@inlang/paraglide-sveltekit';

export default defineConfig({
	build: {
		minify: false
	},
	plugins: [
		sveltekit(),
		paraglideSveltekit({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		})
	]
});
