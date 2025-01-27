import fs from "node:fs";
import {
	paraglideVitePlugin,
	type CompilerOptions,
} from "@inlang/paraglide-js";

/**
 * Reads a file from the file system and returns it as a string.
 */
const file = (path: string) => ({
	[path]: fs.readFileSync(new URL(path, import.meta.url), "utf-8"),
});

/**
 * A Vite plugin that compiles the inlang project and emits output with
 * additional files for SvelteKit.
 *
 * @example
 *   paraglideSveltekit({
 *      project: './project.inlang',
 *      outdir: './src/lib/paraglide',
 *   })
 */
export const paraglideSveltekit = (options: CompilerOptions) =>
	paraglideVitePlugin({
		...options,
		additionalFiles: {
			...file("adapter.js"),
			...options.additionalFiles,
		},
	});
