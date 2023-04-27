import type { NodeishFilesystem } from "../interface.js"

/**
 * "Imports" files from a JSON into the filesystem.
 */
export async function fromJson(args: {
	fs: NodeishFilesystem
	json: Record<string, string>
}): Promise<void> {
	console.log(args)
	throw Error("Not implemented")
}
