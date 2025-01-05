import type { UnpluginFactory } from "unplugin";
import type { ParaglideCompilerOptions } from "../compiler/compileProject.js";
import { compile } from "../compiler/compile.js";
import fs from "node:fs";

export const unpluginFactory: UnpluginFactory<{
	/**
	 * The path to the inlang project.
	 *
	 * @example "./project.inlang"
	 */
	project: string;
	/**
	 * The path to the output directory.
	 *
	 * @example "./src/paraglide"
	 */
	outdir: string;
	options?: ParaglideCompilerOptions;
}> = (args) => ({
	name: "unplugin-paraglide-js",
	enforce: "pre",
	async buildStart() {
		await compile({
			project: args.project,
			outdir: args.outdir,
			options: args.options,
			fs,
		});
	},
});
