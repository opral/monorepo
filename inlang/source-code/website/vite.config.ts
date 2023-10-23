import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import { ssr as vitePluginSsr } from "vite-plugin-ssr/plugin"
import { watch } from "vite-plugin-watch"
import { fileURLToPath, URL } from "node:url"
import Icons from "unplugin-icons/vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"

const isProduction = process.env.NODE_ENV === "production"

export default defineConfig({
	envPrefix: "PUBLIC_",
	plugins: [
		nodePolyfills({
			// Isomorphic git uses node dependencies in the browser without protocol node:* imports.
			// other parts of the source code use server side node dependencies with protocol node:* imports.
			// to not break server side node imports, don't polyfill node:* imports.
			protocolImports: false,
		}),
		solid({ ssr: true }),
		// the metaframework https://vite-plugin-ssr.com/
		vitePluginSsr(),
		// @ts-ignore
		// only https://icon-sets.iconify.design/material-symbols/
		// and https://icon-sets.iconify.design/cib/
		// are installed indicated in the package.json @iconify-json/* packages.
		// use those sites to search for icons.
		Icons({ compiler: "solid" }),
		// markdownHotModuleReload(),
		watch({
			pattern: "static/messages.json",
			command:
				"paraglide-js compile --namespace inlang-marketplace --project ../../../project.inlang.json",
		}),
	],
	resolve: {
		alias: {
			// must also be defined in tsconfig!
			"#src": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	build: {
		// target is es2022 to support top level await
		// https://caniuse.com/?search=top%20level%20await
		target: "es2022",
		minify: isProduction,
	},
})
