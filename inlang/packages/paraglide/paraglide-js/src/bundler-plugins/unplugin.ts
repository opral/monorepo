import type { UnpluginFactory } from "unplugin";
import { compile, type CompilerOptions } from "../compiler/compile.js";
import fs from "node:fs";
import { resolve } from "node:path";
import { nodeNormalizePath } from "../utilities/node-normalize-path.js";
import { Logger } from "../cli/index.js";

const PLUGIN_NAME = "unplugin-paraglide-js";

const logger = new Logger();

let compilationResult: Awaited<ReturnType<typeof compile>> | undefined;

export const unpluginFactory: UnpluginFactory<CompilerOptions> = (args) => ({
	name: PLUGIN_NAME,
	enforce: "pre",
	async buildStart() {
		logger.info("Compiling inlang project...");
		compilationResult = await compile({
			fs: wrappedFs,
			...args,
		});
		logger.success("Compilation complete");

		for (const path of Array.from(readFiles)) {
			this.addWatchFile(path);
		}
	},
	async watchChange(path) {
		const shouldCompile = readFiles.has(path) && !path.includes("cache");
		if (shouldCompile) {
			readFiles.clear();
			logger.info(`Re-compiling inlang project... File "${path}" has changed.`);
			compilationResult = await compile(
				{
					fs: wrappedFs,
					...args,
				},
				compilationResult?.outputHashes
			);
			logger.success("Compilation complete");
		}
	},
	webpack(compiler) {
		//we need the compiler to run before the build so that the message-modules will be present
		//In the other bundlers `buildStart` already runs before the build. In webpack it's a race condition
		compiler.hooks.beforeRun.tapPromise(PLUGIN_NAME, async () => {
			await compile({
				fs: wrappedFs,
				...args,
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
