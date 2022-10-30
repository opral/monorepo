import solid from "vite-plugin-solid";
import { ssr } from "vite-plugin-ssr/plugin";
import type { UserConfig } from "vite";
import { fileURLToPath, URL } from "url";

const config: UserConfig = {
	plugins: [solid({ ssr: true }), ssr()],
	build: {
		// @ts-ignore
		polyfillDynamicImport: false,
	},
	resolve: {
		alias: {
			// must also be defined in tsconfig!
			// !not working
			"@src": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
};

export default config;
