import { defineConfig } from "vite"

const isProduction = process.env.NODE_ENV === "production"

export default defineConfig({
	server: {
		port: 4003,
	},
	envPrefix: "PUBLIC_",
	build: {
		// target is es2022 to support top level await
		// https://caniuse.com/?search=top%20level%20await
		target: "es2022",
		minify: isProduction,
	},
})
