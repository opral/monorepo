import type { UnpluginFactory } from "unplugin";
import { compile, type CompilationResult } from "../compiler/compile.js";
import fs from "node:fs";
import { resolve, relative } from "node:path";
import { nodeNormalizePath } from "../utilities/node-normalize-path.js";
import { Logger } from "../services/logger/index.js";
import type { CompilerOptions } from "../compiler/compiler-options.js";

const PLUGIN_NAME = "unplugin-paraglide-js";

const logger = new Logger();

/**
 * Default isServer which differs per bundler.
 */
let isServer: string | undefined;

let previousCompilation: CompilationResult | undefined;

export const unpluginFactory: UnpluginFactory<CompilerOptions> = (args) => ({
	name: PLUGIN_NAME,
	enforce: "pre",
	async buildStart() {
		logger.info("Compiling inlang project...");
		try {
			previousCompilation = await compile({
				fs: wrappedFs,
				previousCompilation,
				// webpack invokes the `buildStart` api in watch mode,
				// to avoid cleaning the output directory in watch mode,
				// we only clean the output directory if there was no previous compilation
				cleanOutdir: previousCompilation === undefined,
				isServer,
				...args,
			});
			logger.success("Compilation complete");
		} catch (error) {
			logger.error("Failed to compile project:", (error as Error).message);
			logger.info("Please check your translation files for syntax errors.");
		} finally {
			// in any case add the files to watch
			for (const path of Array.from(readFiles)) {
				this.addWatchFile(path);
			}
		}
	},
	async watchChange(path) {
		const shouldCompile = readFiles.has(path) && !path.includes("cache");
		if (shouldCompile === false) {
			return;
		}

		const previouslyReadFiles = new Set(readFiles);

		try {
			logger.info(
				`Re-compiling inlang project... File "${relative(process.cwd(), path)}" has changed.`
			);

			// Clear readFiles to track fresh file reads
			readFiles.clear();

			previousCompilation = await compile({
				fs: wrappedFs,
				previousCompilation,
				cleanOutdir: false,
				isServer,
				...args,
			});

			logger.success("Re-compilation complete");

			// Add any new files to watch
			for (const filePath of Array.from(readFiles)) {
				this.addWatchFile(filePath);
			}
		} catch (e) {
			readFiles = previouslyReadFiles;
			// Reset compilation result on error
			previousCompilation = undefined;
			logger.warn("Failed to re-compile project:", (e as Error).message);
		}
	},
	vite: {
		config: {
			handler: () => {
				isServer = "import.meta.env.SSR";
			},
		},
	},
	webpack(compiler) {
		compiler.options.resolve = {
			...compiler.options.resolve,
			fallback: {
				...compiler.options.resolve?.fallback,
				// https://stackoverflow.com/a/72989932
				async_hooks: false,
			},
		};

		compiler.hooks.beforeRun.tapPromise(PLUGIN_NAME, async () => {
			try {
				previousCompilation = await compile({
					fs: wrappedFs,
					previousCompilation,
					// clean dir needs to be false. otherwise webpack get's into a race condition
					// of deleting the output directory and writing files at the same time for
					// multi environment builds
					cleanOutdir: false,
					...args,
				});
				logger.success("Compilation complete");
			} catch (error) {
				logger.warn("Failed to compile project:", (error as Error).message);
				logger.warn("Please check your translation files for syntax errors.");
			}
		});
	},
});

let readFiles = new Set<string>();

// Create a wrapper around the fs object to intercept and store read files
const wrappedFs: typeof import("node:fs") = {
	...fs,
	// @ts-expect-error - Node's fs has too many overloads
	readFile: (
		path: fs.PathLike | number,
		options: { encoding?: null; flag?: string } | null | undefined,
		callback: (err: NodeJS.ErrnoException | null, data: Buffer) => void
	) => {
		readFiles.add(nodeNormalizePath(resolve(process.cwd(), path.toString())));
		return fs.readFile(path, options, callback);
	},
	// @ts-expect-error - Node's fs has too many overloads
	readFileSync: (
		path: fs.PathLike | number,
		options?: { encoding?: null; flag?: string } | null | undefined
	) => {
		readFiles.add(nodeNormalizePath(resolve(process.cwd(), path.toString())));
		return fs.readFileSync(path, options);
	},
	promises: {
		...fs.promises,
		// @ts-expect-error - Node's fs.promises has too many overloads
		readFile: async (
			path: fs.PathLike,
			options?: { encoding?: null; flag?: string } | null
		): Promise<Buffer> => {
			readFiles.add(nodeNormalizePath(resolve(process.cwd(), path.toString())));
			return fs.promises.readFile(path, options);
		},
	},
	// Add other fs methods as needed
};
