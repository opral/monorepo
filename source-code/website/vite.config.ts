import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import { ssr as vitePluginSsr } from "vite-plugin-ssr/plugin"
import { telefunc } from "telefunc/vite"
import { fileURLToPath, URL } from "node:url"
import Icons from "unplugin-icons/vite"
import { nodePolyfills } from "vite-plugin-node-polyfills"
import { isProduction } from "./env.js"

export default defineConfig({
	envPrefix: "PUBLIC_",
	plugins: [
		nodePolyfills({
			protocolImports: true,
		}),
		solid({ ssr: true }),
		// ordering matters. telefunc must be before ssr
		telefunc(),
		// the metaframework https://vite-plugin-ssr.com/
		vitePluginSsr(),
		// @ts-ignore
		// only https://icon-sets.iconify.design/material-symbols/
		// and https://icon-sets.iconify.design/cib/
		// are installed indicated in the package.json @iconify-json/* packages.
		// use those sites to search for icons.
		Icons({ compiler: "solid" }),
		// markdownHotModuleReload(),
	],
	resolve: {
		alias: {
			// must also be defined in tsconfig!
			"@src": fileURLToPath(new URL("./src", import.meta.url)),
			"@env": fileURLToPath(new URL("./env.ts", import.meta.url)),
		},
	},
	build: {
		// target is es2022 to support top level await
		// https://caniuse.com/?search=top%20level%20await
		target: "es2022",
		minify: isProduction,
	},
})
