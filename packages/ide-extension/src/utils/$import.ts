import { dedent } from "ts-dedent"
import path from "node:path"
import ts from "typescript"
import * as vscode from "vscode"
import fsExtra from "fs-extra"
import type { $fs } from "@inlang/core/environment"
import { normalizePath } from "@inlang-git/fs"
import type fetch from "node-fetch"

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

export type $import = (uri: string) => Promise<any>

/**
 * Initializes the $import function.
 *
 * @example
 * const $import = initialize$import({ fs: fs, fetch });
 * const module = await $import('./some-module.js');
 */
export function initialize$import(args: {
	/** the fs from which the file can be read */
	fs: $fs
	/** http client implementation */
	fetch: typeof fetch
}): (uri: string) => ReturnType<typeof $import> {
	// resembles a native import api
	return (uri: string) => $import(uri, args)
}

/**
 * Error thrown when the $import function fails.
 *
 * Dedicated class to make it easier to identify this error.
 */
class $ImportError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "$ImportError"
	}
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
		/** the fs from which the file can be read */
		fs: $fs
		/** http client implementation */
		fetch: typeof fetch
	},
): Promise<any> {
	// avoiding browser built-in shadowing of fetch as global variable
	const _fetch = environment.fetch
	// polyfill for environments that don't support dynamic
	// http imports yet like VSCode.
	const moduleAsText = uri.startsWith("http")
		? await (await _fetch(uri)).text()
		: ((await environment.fs.readFile(normalizePath(uri), { encoding: "utf-8" })) as string)
	try {
		return await transpile$import(/* @vite-ignore */ moduleAsText)
	} catch (error) {
		let message = `Error while importing ${uri}: ${(error as Error)?.message ?? "Unknown error"}`
		if (error instanceof SyntaxError && uri.includes("jsdelivr")) {
			message += dedent`\n\n
Are you sure that the file exists on JSDelivr?

The error indicates that the imported file does not exist on JSDelivr. For non-existent files, JSDelivr returns a 404 text that JS cannot parse as a module and throws a SyntaxError.
			`
		}
		throw new $ImportError(message)
	}
}

// Custom $import function
export const transpile$import = async (code: string): Promise<any> => {
	// Read the code from the module path
	// const code = await vscode.workspace.fs.readFile(vscode.Uri.file(modulePath))

	// Transpile the code to CommonJS
	const transpiledCode = transpileCode(code.toString())

	// Create the .inlang folder if it doesn't exist
	const inlangFolder = ".inlang"
	const rootFolder = vscode.workspace.workspaceFolders?.[0]

	if (!rootFolder) {
		// Handle root folder not found
		console.error("No workspace folder found.")
		return undefined
	}

	const folderUri = rootFolder.uri.with({ path: path.join(rootFolder.uri.path, inlangFolder) })

	try {
		await vscode.workspace.fs.createDirectory(folderUri)
	} catch (error) {
		// Handle folder creation error
		console.error("Failed to create .inlang folder:", error)
		return undefined
	}

	// Generate a random file name
	const tempFileName = `${Math.random().toString(36).slice(7)}.cjs`
	const tempFilePath = folderUri.with({ path: path.join(folderUri.path, tempFileName) })

	// Write the transpiled code to a temporary file
	await vscode.workspace.fs.writeFile(tempFilePath, Buffer.from(transpiledCode))

	// Use require to load the transpiled code
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const module = require(tempFilePath.fsPath)

	// Clean up the temporary file and folder
	await vscode.workspace.fs.delete(tempFilePath)
	await fsExtra.remove(folderUri.fsPath)

	return module
}

// Transpile code to CommonJS using TypeScript Compiler API
function transpileCode(code: string): string {
	const compilerOptions: ts.CompilerOptions = {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2015,
	}

	const result = ts.transpileModule(code, { compilerOptions })
	return result.outputText
}
