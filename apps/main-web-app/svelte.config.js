import adapter from '@sveltejs/adapter-auto';
import netlify from '@sveltejs/adapter-netlify';

import preprocess from 'svelte-preprocess';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: preprocess(),

	kit: {
		adapter: netlify(),
		vite: {
			// required node (fs) polyfills
			resolve: {
				alias: {
					path: 'path-browserify'
				}
			},
			// required node (fs) polyfills
			optimizeDeps: {
				esbuildOptions: {
					// Node.js global to browser globalThis
					define: {
						global: 'globalThis'
					},
					// Enable esbuild polyfill plugins
					plugins: [
						NodeGlobalsPolyfillPlugin({
							buffer: true
						})
					]
				}
			}
		}
	}
};

export default config;
