import { defineConfig } from "@solidjs/start/config"
// import { paraglide } from "@inlang/paraglide-js-adapter-vite"

export default defineConfig({
	start: { ssr: true },
	plugins: [
		/*
		Currently the paraglide vite plugin is not working
		with the new version of SolidStart.
		*/
		// paraglide({
		// 	project: "./project.inlang",
		// 	outdir: "./src/paraglide",
		// }),
	],
})
