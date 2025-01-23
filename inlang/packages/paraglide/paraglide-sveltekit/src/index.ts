import fs from "node:fs";
import { paraglideVitePlugin, type CompilerArgs } from "@inlang/paraglide-js";

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
 *   paraglideSvelteKit({
 *      project: './project.inlang',
 *      outdir: './src/lib/paraglide',
 *   })
 */
export const paraglideSvelteKit = (args: CompilerArgs) =>
	paraglideVitePlugin({
		...args,
		additionalFiles: {
			...file("adapter.js"),
			...file("adapter.provider.svelte"),
			...args.additionalFiles,
		},
	});
