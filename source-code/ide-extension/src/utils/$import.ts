import path from "node:path"
import ts from "typescript"
import * as vscode from "vscode"
import fsExtra from "fs-extra"

// Transpile code to CommonJS using TypeScript Compiler API
function transpileCode(code: string): string {
	const compilerOptions: ts.CompilerOptions = {
		module: ts.ModuleKind.CommonJS,
		target: ts.ScriptTarget.ES2015,
	}

	const result = ts.transpileModule(code, { compilerOptions })
	return result.outputText
}

// Custom $import function
export const $import = async (modulePath: string): Promise<any> => {
	// Read the code from the module path
	const code = await vscode.workspace.fs.readFile(vscode.Uri.file(modulePath))

	// Transpile the code to CommonJS
	const transpiledCode = transpileCode(code.toString())

	console.log("transpiledCode", transpiledCode)

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
