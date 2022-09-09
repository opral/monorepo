import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
	build: {
		rollupOptions: {
			input: ["./src/Clock.svelte", "./src/Counter.svelte"],
		},
	},
	plugins: [svelte({ compilerOptions: { customElement: true } })],
});
