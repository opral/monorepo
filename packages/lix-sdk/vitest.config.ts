import { defineConfig } from "vitest/config";
import codspeedPlugin from "@codspeed/vitest-plugin";

export default defineConfig({
	plugins: [process.env.CODSPEED_BENCH ? codspeedPlugin() : undefined],
	test: {
		// default timeout
		testTimeout: 20000,
	},
});
