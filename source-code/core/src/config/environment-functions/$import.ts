import type { fs } from "memfs";

/**
 * Importing ES modules either from a local path, or from a url.
 *
 * The imported module must be ESM. A good indicator is whether
 * the "type" property in a package.json is set to "module" if
 * node is used.
 *
 * Read more on https://inlang.com/documentation/config
 */
//
// - explitcly export the interface of $import to be consumed
//   in the config with JSdoc.
//
// - not using ReturnType or FunctionArguments to increase DX
//   when hovering over the type.
//
export type $import = (uri: string) => Promise<any>;

/**
 * Initializes the $import function.
 *
 * @example
 * 	const $import = createImportFunction({ basePath: '/', fs: fs.promises });
 * 	const module = await $import('./mock-module.js');
 */
export function initialize$import(args: {
	/** the directory from which the import should be resolved */
	basePath: string;
	/** the fs from which the file can be read */
	fs: typeof fs.promises;
	fetch: typeof fetch;
}): (uri: string) => ReturnType<typeof $import> {
	// resembles a native import api
	return (uri: string) => $import(uri, args);
}

/**
 * Importing ES modules either from a local path, or from a url.
 *
 * The imported module must be ESM. A good indicator is whether
 * the "type" property in a package.json is set to "module" if
 * node is used.
 *
 * Read more on https://inlang.com/documentation/config
 */
async function $import(
	uri: string,
	environment: {
		/** current working directory from which the import should be resolved */
		basePath: string;
		/** the fs from which the file can be read */
		fs: typeof fs.promises;
		/** the http client (avoiding side-effects) */
		fetch: typeof fetch;
	}
): Promise<any> {
	// polyfill for environments that don't support dynamic
	// http imports yet like VSCode.
	let moduleAsText: string;
	if (uri.startsWith("http")) {
		moduleAsText = await (await environment.fetch(uri)).text();
	} else {
		moduleAsText = (await environment.fs.readFile(
			`${environment.basePath}/${uri}`,
			"utf-8"
		)) as string;
	}
	const moduleWithMimeType =
		"data:application/javascript;base64," + btoa(moduleAsText);
	return await import(/* @vite-ignore */ moduleWithMimeType);
}
