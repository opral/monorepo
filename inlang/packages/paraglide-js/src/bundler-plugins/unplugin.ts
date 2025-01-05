import type { UnpluginFactory } from "unplugin";
import type { ParaglideCompilerOptions } from "../compiler/compileProject.js";
import { compile } from "../compiler/compile.js";
import fs from "node:fs";
import chokidar from "chokidar";

const PLUGIN_NAME = "unplugin-paraglide-js";

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
	name: PLUGIN_NAME,
	enforce: "pre",
	async buildStart() {
		const compileArgs = {
			project: args.project,
			outdir: args.outdir,
			options: args.options,
			fs: wrappedFs,
		};

		// initial compilation
		await compile(compileArgs);

		console.log("Watching for changes...", Array.from(readFiles));

		// Watch for changes to the files that have been read by the compile function
		const watcher = chokidar.watch(Array.from(readFiles), {
			persistent: true,
		});

		const recompile = async () => {
			// using try catch because an invalid json while editing
			// can throw but shouldn't stop the compiler.
			try {
				// Clear the set before recompiling
				readFiles.clear();
				await compile(compileArgs);
				// Update the watcher with new files
				watcher.add(Array.from(readFiles));
			} catch (e) {
				console.error("Error while compiling the inlang project:", e);
			}
		};

		watcher.on("change", async (path) => {
			console.log(`File ${path} has been changed. Recompiling...`);
			await recompile();
		});

		watcher.on("unlink", async (path) => {
			console.log(`File ${path} has been removed. Recompiling...`);
			await recompile();
		});
	},
	webpack(compiler) {
		//we need the compiler to run before the build so that the message-modules will be present
		//In the other bundlers `buildStart` already runs before the build. In webpack it's a race condition
		compiler.hooks.beforeRun.tapPromise(PLUGIN_NAME, async () => {
			await compile({
				project: args.project,
				outdir: args.outdir,
				options: args.options,
				fs: wrappedFs,
			});
		});
	},
});

const readFiles = new Set<string>();

// Create a wrapper around the fs object to intercept and store read files
const wrappedFs: typeof import("node:fs") = {
	...fs,
	// @ts-expect-error - Node's fs has too many overloads
	readFile: (
		path: fs.PathLike | number,
		options: { encoding?: null; flag?: string } | null | undefined,
		callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void
	) => {
		readFiles.add(path.toString());
		return fs.readFile(path, options, callback);
	},
	// @ts-expect-error - Node's fs has too many overloads
	readFileSync: (
		path: fs.PathLike | number,
		options?: { encoding?: null; flag?: string } | null | undefined
	) => {
		readFiles.add(path.toString());
		return fs.readFileSync(path, options);
	},
	promises: {
		...fs.promises,
		// @ts-expect-error - Node's fs.promises has too many overloads
		readFile: async (
			path: fs.PathLike,
			options?: { encoding?: null; flag?: string } | null
		): Promise<Buffer> => {
			readFiles.add(path.toString());
			return fs.promises.readFile(path, options);
		},
	},
	// Add other fs methods as needed
};