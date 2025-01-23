import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { paraglideSvelteKit } from '@inlang/paraglide-sveltekit';

export default defineConfig({
	plugins: [
		sveltekit(),
		paraglideSvelteKit({
			project: './project.inlang',
			outdir: './src/lib/paraglide'
		})
	]
});
