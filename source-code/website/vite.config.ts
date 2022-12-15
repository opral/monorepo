import type { UserConfig } from "vite";
import solid from "vite-plugin-solid";
import { ssr } from "vite-plugin-ssr/plugin";
import { telefunc } from "telefunc/vite";
import { fileURLToPath, URL } from "url";
import { validateEnv } from "./env.js";
import Icons from "unplugin-icons/vite";

// validate the env variables.
validateEnv();

export default await withFsPolyfills({
	plugins: [
		solid({ ssr: true }),
		// ordering matters. telefunc must be before ssr
		telefunc(),
		ssr(),
		// @ts-ignore
		// only https://icon-sets.iconify.design/material-symbols/
		// and https://icon-sets.iconify.design/cib/
		// are installed indicated in the package.json @iconify-json/* packages.
		// use those sites to search for icons.
		Icons({ compiler: "solid" }),
	],
	resolve: {
		alias: {
			// must also be defined in tsconfig!
			"@src": fileURLToPath(new URL("./src", import.meta.url)),
			"@env": fileURLToPath(new URL("./env.ts", import.meta.url)),
		},
	},
});

/**
 * Polyfills to use fs in the browser.
 *
 * Seperated from the main config for readability.
 */
async function withFsPolyfills(config: UserConfig): Promise<UserConfig> {
	// import required modules
	const rollupNodePolyFill = (await import("rollup-plugin-node-polyfills"))
		.default;
	const { NodeGlobalsPolyfillPlugin } = await import(
		"@esbuild-plugins/node-globals-polyfill"
	);
	const { NodeModulesPolyfillPlugin } = await import(
		"@esbuild-plugins/node-modules-polyfill"
	);
	const { merge } = await import("lodash-es");
	const polyfillConfig: UserConfig = {
		plugins: [
			// @ts-ignore
			// enable node polyfills in rollup
			rollupNodePolyFill(),
		],
		resolve: {
			alias: {
				events: "rollup-plugin-node-polyfills/polyfills/events",
				path: "rollup-plugin-node-polyfills/polyfills/path",
			},
		},
		optimizeDeps: {
			esbuildOptions: {
				// Node.js global to browser globalThis
				define: {
					global: "globalThis",
				},
				// Enable esbuild polyfill plugins
				plugins: [
					NodeGlobalsPolyfillPlugin({
						process: true,
						buffer: true,
					}),
					NodeModulesPolyfillPlugin(),
				],
			},
		},
	};
	return merge(polyfillConfig, config);
}
