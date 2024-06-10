import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import vikeSolid from "vike-solid/vite"
import vike from "vike/plugin"
import { fileURLToPath, URL } from "node:url"
import Icons from "unplugin-icons/vite"
import { paraglide } from "@inlang/paraglide-vite"

const isProduction = process.env.NODE_ENV === "production"

export default defineConfig({
	server: {
		port: 4001,
	},
	envPrefix: "PUBLIC_",
	plugins: [
		solid({ ssr: true }),
		// the metaframework https://vike.dev/
		vike(),
		vikeSolid(),

		// @ts-ignore
		// only https://icon-sets.iconify.design/material-symbols/
		// and https://icon-sets.iconify.design/cib/
		// are installed indicated in the package.json @iconify-json/* packages.
		// use those sites to search for icons.
		Icons({ compiler: "solid" }),
		// markdownHotModuleReload(),
		paraglide({
			project: "./website.inlang",
			outdir: "./src/paraglide",
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
