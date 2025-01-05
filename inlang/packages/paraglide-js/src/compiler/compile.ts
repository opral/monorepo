import { loadProjectFromDirectory } from "@inlang/sdk";
import path from "node:path";
import { ENV_VARIABLES } from "../services/env-variables/index.js";
import {
	compileProject,
	type ParaglideCompilerOptions,
} from "./compileProject.js";
import { writeOutput } from "../services/file-handling/write-output.js";

/**
 * Loads, compiles, and writes the output to disk.
 *
 * This is the main function to use when you want to compile a project.
 * If you want to adjust inlang project loading, or the output, use
 * `compileProject()` instead.
 *
 * @example
 *   await compile({
 *     project: 'path/to/project',
 *     outdir: 'path/to/output',
 *   })
 */
export async function compile(args: {
	project: string;
	outdir: string;
	fs: typeof import("node:fs");
	options?: ParaglideCompilerOptions;
}): Promise<void> {
	const absoluteOutdir = path.resolve(process.cwd(), args.outdir);

	const project = await loadProjectFromDirectory({
		path: args.project,
		fs: args.fs,
		appId: ENV_VARIABLES.PARJS_APP_ID,
	});

	const output = await compileProject({
		project,
		options: args.options,
	});

	await writeOutput(absoluteOutdir, output, args.fs.promises);

	await project.close();
	await new Promise((resolve) => setTimeout(resolve, 1000));
}
