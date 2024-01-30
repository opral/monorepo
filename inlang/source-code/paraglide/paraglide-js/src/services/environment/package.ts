import type { NodeishFilesystem } from "@lix-js/fs"

/**
 * Attempts to find the package.json file that's closest to the current working directory.
 *
 * @param fs The filesystem to use.
 * @param path The path to start searching from.
 * @returns The path to the package.json file, or undefined if none was found.
 */
export async function findPackageJson(fs: NodeishFilesystem, path: string): string | undefined {
	try {
	} catch (error) {
		if (error.code === "ENOENT") {
			return undefined
		}
		throw error
	}
}
