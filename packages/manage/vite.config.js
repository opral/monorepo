import { defineConfig } from "vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"

const isProduction = process.env.NODE_ENV === "production"

export default defineConfig({
	server: {
		port: 4004,
	},
	plugins: [
		nodePolyfills({
			// Isomorphic git uses node dependencies in the browser without protocol node:* imports.
			// other parts of the source code use server side node dependencies with protocol node:* imports.
			// to not break server side node imports, don't polyfill node:* imports.
			protocolImports: false,
		}),
	],
	envPrefix: "PUBLIC_",
	rollupOptions: {
		output: {
			preserveModules: true,
		},
	},
})
