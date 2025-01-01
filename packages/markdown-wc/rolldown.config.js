import { defineConfig } from "rolldown"

// bundling the embed-markdown-wc element
// for ease of use in the browser
export default defineConfig({
	input: `src/markdown-wc-embed.ts`,
	output: {
		file: `dist/markdown-wc-embed.js`,
		format: "esm",
		minify: false,
		// minify is still in beta at the time of writing (Dec 29, 2024)
		// minify: true,
	},
})
