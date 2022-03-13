import preprocess from 'svelte-preprocess';
// import netlify from '@sveltejs/adapter-netlify';
import node from '@sveltejs/adapter-node';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';

// importing validateEnv script which leads to auto execution of the script
import './validateEnv.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://github.com/sveltejs/svelte-preprocess
	// for more information about preprocessors
	preprocess: [
		preprocess({
			postcss: true
		})
	],

	kit: {
		// hydrate the <div id="svelte"> element in src/app.html
		target: '#svelte',
		adapter: node(),
		vite: {
			resolve: {
				alias: {
					path: 'path-browserify'
				}
			},
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
