import type { UnpluginFactory } from "unplugin";
import { compile, type CompilerArgs } from "../compiler/compile.js";
import fs from "node:fs";
import { resolve } from "node:path";

const PLUGIN_NAME = "unplugin-paraglide-js";

export const unpluginFactory: UnpluginFactory<CompilerArgs> = (args) => ({
	name: PLUGIN_NAME,
	enforce: "pre",
	async buildStart() {
		await compile({
			fs: wrappedFs,
			...args,
		});

		for (const path of Array.from(readFiles)) {
			this.addWatchFile(path);
		}
	},
	async watchChange(path) {
		if (readFiles.has(path)) {
			readFiles.clear();
			await compile({
				fs: wrappedFs,
				...args,
			});
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
		readFiles.add(resolve(process.cwd(), path.toString()));
		return fs.readFile(path, options, callback);
	},
	// @ts-expect-error - Node's fs has too many overloads
	readFileSync: (
		path: fs.PathLike | number,
		options?: { encoding?: null; flag?: string } | null | undefined
	) => {
		readFiles.add(resolve(process.cwd(), path.toString()));
		return fs.readFileSync(path, options);
	},
	promises: {
		...fs.promises,
		// @ts-expect-error - Node's fs.promises has too many overloads
		readFile: async (
			path: fs.PathLike,
			options?: { encoding?: null; flag?: string } | null
		): Promise<Buffer> => {
			readFiles.add(resolve(process.cwd(), path.toString()));
			return fs.promises.readFile(path, options);
		},
	},
	// Add other fs methods as needed
};
