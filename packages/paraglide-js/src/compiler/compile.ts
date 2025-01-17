import { loadProjectFromDirectory } from "@inlang/sdk";
import path from "node:path";
import { ENV_VARIABLES } from "../services/env-variables/index.js";
import { compileProject, type CompilerOptions } from "./compile-project.js";
import { writeOutput } from "../services/file-handling/write-output.js";
import {
	getLocalAccount,
	saveLocalAccount,
} from "../services/account/index.js";

export type CompilerArgs = {
	/**
	 * The path to the project to compile.
	 *
	 * @example
	 *   './project.inlang'
	 */
	project: string;
	/**
	 * The path to the directory to write the output to.
	 *
	 * @example
	 *   './src/paraglide'
	 */
	outdir: string;
	/**
	 * Additional compiler options.
	 */
	compilerOptions?: CompilerOptions;
	/**
	 * The file system to use. Defaults to `await import('node:fs')`.
	 *
	 * Useful for testing the paraglide compiler by mocking the fs.
	 */
	fs?: typeof import("node:fs");
};

// This is a workaround to prevent multiple compilations from running at the same time.
// https://github.com/opral/inlang-paraglide-js/issues/320#issuecomment-2596951222
let compilationInProgress: Promise<void> | null = null;

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
export async function compile(args: CompilerArgs): Promise<void> {
	if (compilationInProgress) {
		await compilationInProgress;
	}

	compilationInProgress = (async () => {
		const fs = args.fs ?? (await import("node:fs"));
		const absoluteOutdir = path.resolve(process.cwd(), args.outdir);

		const localAccount = getLocalAccount({ fs });

		const project = await loadProjectFromDirectory({
			path: args.project,
			fs,
			account: localAccount,
			appId: ENV_VARIABLES.PARJS_APP_ID,
		});

		const output = await compileProject({
			project,
			compilerOptions: args.compilerOptions,
		});

		await writeOutput(absoluteOutdir, output, fs.promises);

		if (!localAccount) {
			const activeAccount = await project.lix.db
				.selectFrom("active_account")
				.selectAll()
				.executeTakeFirstOrThrow();

			saveLocalAccount({ fs, account: activeAccount });
		}

		await project.close();
	})();

	await compilationInProgress;
	compilationInProgress = null;
}
