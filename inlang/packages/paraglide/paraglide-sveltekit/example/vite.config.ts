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
			outdir: './src/lib/paraglide',
			strategy: ['urlPattern', 'cookie', 'baseLocale'],
			urlPatterns: [
				{
					pattern: ':protocol://:domain(.*)::port?/:locale(de)?/:path(.*)?',
					localizedNamedGroups: {
						en: { locale: null },
						de: { locale: 'de' }
					},
					deLocalizedNamedGroups: { locale: null }
				}
			]
		})
	]
});
