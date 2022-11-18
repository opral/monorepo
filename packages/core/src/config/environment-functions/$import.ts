import type { fs } from "memfs";

/**
 * Importing ES modules either from a local path, or from a url.
 *
 * The imported module must be ESM. A good indicator is whether
 * the "type" property in a package.json is set to "module" if
 * node is used.
 *
 * _[See test cases](./$import.test.js)_
 */
// Some environments do not support the import of modules from a url.
export async function $import(
	uri: string,
	options: {
		/** current working directory from which the import should be resolved */
		basePath: string;
		/** the fs from which the file can be read */
		fs: typeof fs.promises;
	}
): Promise<any> {
	// polyfill for environments that don't support dynamic
	// http imports yet like VSCode.
	let moduleAsText: string;
	if (uri.startsWith("http")) {
		moduleAsText = await (await fetch(uri)).text();
	} else {
		moduleAsText = (await options.fs.readFile(
			`${options.basePath}/${uri}`,
			"utf-8"
		)) as string;
	}
	const moduleWithMimeType =
		"data:application/javascript;base64," + btoa(moduleAsText);
	return await import(/* @vite-ignore */ moduleWithMimeType);
}
