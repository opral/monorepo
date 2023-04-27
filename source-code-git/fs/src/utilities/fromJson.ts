import type { Filesystem } from "../interface.js"

/**
 * "Imports" files from a JSON into the filesystem.
 */
export async function fromJson(args: {
	fs: Filesystem
	json: Record<string, string>
}): Promise<void> {
	console.log(args)
	throw Error("Not implemented")
}
