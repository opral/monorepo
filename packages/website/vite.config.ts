import type { UserConfig } from "vite";
import solid from "vite-plugin-solid";
import { ssr } from "vite-plugin-ssr/plugin";
import { telefunc } from "telefunc/vite";
import { fileURLToPath, URL } from "url";

export default await withFsPolyfills({
	plugins: [
		solid({ ssr: true }),
		// ordering matters. telefunc must be before ssr
		telefunc(),
		ssr(),
	],
	resolve: {
		alias: {
			// must also be defined in tsconfig!
			"@src": fileURLToPath(new URL("./src", import.meta.url)),
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
	const nodePolyfills = await (
		await import("rollup-plugin-polyfill-node")
	).default;
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
			nodePolyfills(),
		],
		resolve: {
			alias: {
				events: "rollup-plugin-polyfill-node",
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
