import { build, UserConfig } from "vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";

const configs: UserConfig[] = [
	{
		plugins: [
			paraglideVitePlugin({
				project: "./project.inlang",
				outdir: "./src/paraglide",
			}),
		],
		build: {
			minify: false,
		},
	},
	{
		build: {
			minify: false,
			target: "es2024",
			// don't load the module preload to keep the bundle free
			// from side effects that could affect the benchmark
			modulePreload: false,
		},
		plugins: [
			paraglideVitePlugin({
				project: "./project.inlang",
				outdir: "./src/paraglide",
			}),
		],
	},
];

export async function runBuilds() {
	for (const { name, config } of configs) {
		console.log(`Building ${name}...`);
		await build(config);
		console.log(`${name} build complete.`);
	}
}

await runBuilds();
