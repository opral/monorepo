// vitest.config.ts (Combined Vite/Vitest config)
import { defineConfig } from "vitest/config"; // Revert import back to vitest/config
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	test: {
		environment: "jsdom",
	},
});
