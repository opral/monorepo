import { loadProjectFromDirectory } from "@inlang/sdk";
import path from "node:path";
import { ENV_VARIABLES } from "../services/env-variables/index.js";
import { compileProject } from "./compile-project.js";
import { writeOutput } from "../services/file-handling/write-output.js";
import {
	getLocalAccount,
	saveLocalAccount,
} from "../services/account/index.js";
import {
	defaultCompilerOptions,
	type CompilerOptions,
} from "./compiler-options.js";

// This is a workaround to prevent multiple compilations from running at the same time.
// https://github.com/opral/inlang-paraglide-js/issues/320#issuecomment-2596951222
let compilationInProgress: Promise<{
	outputHashes: Record<string, string> | undefined;
}> | null = null;

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
export async function compile(
	options: CompilerOptions,
	previousOutputHashes?: Record<string, string>
): Promise<{ outputHashes: Record<string, string> | undefined }> {
	const withDefaultOptions = {
		...defaultCompilerOptions,
		...options,
	};

	if (compilationInProgress) {
		await compilationInProgress;
	}

	compilationInProgress = (async () => {
		const fs = withDefaultOptions.fs ?? (await import("node:fs"));
		const absoluteOutdir = path.resolve(
			process.cwd(),
			withDefaultOptions.outdir
		);

		const localAccount = getLocalAccount({ fs });

		const project = await loadProjectFromDirectory({
			path: withDefaultOptions.project,
			fs,
			account: localAccount,
			appId: ENV_VARIABLES.PARJS_APP_ID,
		});

		const output = await compileProject({
			compilerOptions: withDefaultOptions,
			project,
		});

		const outputHashes = await writeOutput({
			directory: absoluteOutdir,
			output,
			fs: fs.promises,
			previousOutputHashes,
		});

		if (!localAccount) {
			const activeAccount = await project.lix.db
				.selectFrom("active_account")
				.selectAll()
				.executeTakeFirstOrThrow();

			saveLocalAccount({ fs, account: activeAccount });
		}

		await project.close();

		return { outputHashes };
	})();

	const result = structuredClone(await compilationInProgress);
	compilationInProgress = null;

	return result;
}
