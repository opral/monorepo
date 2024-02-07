import dedent from "dedent"
import type { NodeishFilesystemSubset } from "@inlang/plugin"
import { ModuleImportError } from "./errors.js"

/**
 * Importing ES modules either from a local path, or from a url.
 *
 * - Name the import function `_import` to avoid shadowing the
 *   native import function.
 */
export type ImportFunction = (uri: string) => Promise<any>

/**
 * Creates the import function.
 *
 * This function is required to import modules from a local path.
 *
 * @example
 *   const $import = createImport({ readFile: fs.readFile, fetch });
 *   const module = await _import('./some-module.js');
 */
export function createImport(args: {
	/** the fs from which the file can be read */
	readFile: NodeishFilesystemSubset["readFile"]
}): (uri: string) => ReturnType<typeof $import> {
	// resembles a native import api
	return (uri: string) => $import(uri, args)
}

async function $import(
	uri: string,
	options: {
		/**
		 * Required to import from a local path.
		 */
		readFile: NodeishFilesystemSubset["readFile"]
	}
): Promise<any> {
	let moduleAsText: string

	if (uri.startsWith("http")) {
		moduleAsText = await (await fetch(uri)).text()
	} else {
		moduleAsText = await options.readFile(uri, {
			encoding: "utf-8",
		})
	}

	const moduleWithMimeType = "data:application/javascript," + encodeURIComponent(moduleAsText)

	try {
		return await import(/* @vite-ignore */ moduleWithMimeType)
	} catch (error) {
		if (error instanceof SyntaxError && uri.includes("jsdelivr")) {
			error.message += dedent`\n\n
Are you sure that the file exists on JSDelivr?

The error indicates that the imported file does not exist on JSDelivr. For non-existent files, JSDelivr returns a 404 text that JS cannot parse as a module and throws a SyntaxError.
			`
		}
		throw new ModuleImportError({ module: uri, cause: error as Error })
	}
}
