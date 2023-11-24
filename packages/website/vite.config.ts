import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import { ssr as vikePlugin } from "vike/plugin"
import { watch } from "vite-plugin-watch"
import { fileURLToPath, URL } from "node:url"
import Icons from "unplugin-icons/vite"

const isProduction = process.env.NODE_ENV === "production"

export default defineConfig({
	server: {
		port: 4002,
	},
	envPrefix: "PUBLIC_",
	plugins: [
		solid({ ssr: true }),
		// the metaframework https://vike.dev/
		vikePlugin(),
		// @ts-ignore
		// only https://icon-sets.iconify.design/material-symbols/
		// and https://icon-sets.iconify.design/cib/
		// are installed indicated in the package.json @iconify-json/* packages.
		// use those sites to search for icons.
		Icons({ compiler: "solid" }),
		// markdownHotModuleReload(),
		watch({
			pattern: "static/messages.json",
			command: "paraglide-js compile --project ../../../project.inlang.json",
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
