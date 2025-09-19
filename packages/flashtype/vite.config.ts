import { defineConfig } from "vite";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react(), TanStackRouterVite(), tailwindcss(), cloudflare()],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
});
