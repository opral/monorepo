import type { AstroIntegration } from "astro";
import {
	paraglideVitePlugin,
	type CompilerOptions,
} from "@inlang/paraglide-js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { nodeNormalizePath } from "./normalize-path.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const middlewarePath = path.join(__dirname, "middleware.js");

export function integration(options: CompilerOptions): AstroIntegration {
	return {
		name: "paraglide",
		hooks: {
			"astro:config:setup": async ({ addMiddleware, updateConfig }) => {
				//Register the middleware
				addMiddleware({
					order: "pre", //Run before user-defined middleware (why not?)
					entrypoint: middlewarePath,
				});

				const runtimePath = path.resolve(
					process.cwd(),
					options.outdir,
					"runtime.js",
				);

				//Register the vite plugin
				updateConfig({
					vite: {
						plugins: [
							paraglideVitePlugin({
								...options,
								isServer: "import.meta.env.SSR",
							}),
							alias({
								//normalizing the path is very important!
								//otherwise you get duplicate modules on windows
								//learned that one the hard way (parjs-47)
								"virtual:paraglide-astro:runtime":
									nodeNormalizePath(runtimePath),
							}),
						],
					},
				});

				return undefined;
			},
		},
	};
}

function alias(map: Record<string, string>) {
	return {
		name: "astro-plugin-paraglide-alias",
		resolveId(id: string) {
			return map[id];
		},
	};
}
