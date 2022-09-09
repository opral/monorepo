import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// good article about setting up svelte web components
// www.thisdot.co/blog/web-components-with-svelte
export default defineConfig({
	build: {
		// rollupOptions: {
		// 	input: ["./src/Counter.svelte", "./src/Clock.svelte"],
		// },
		lib: {
			entry: "./src/main.ts",
			formats: ["es"],
			fileName: "index",
		},
	},
	plugins: [svelte({ compilerOptions: { customElement: true } })],
});
