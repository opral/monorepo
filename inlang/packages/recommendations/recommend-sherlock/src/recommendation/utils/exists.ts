/**
 * Returns true if the path exists (file or directory), false otherwise.
 *
 * @param nodeishFs
 * @returns
 */
export async function pathExists(
	filePath: string,
	nodeishFs: typeof import("node:fs/promises")
) {
	try {
		await nodeishFs.stat(filePath);
		return true;
	} catch (error) {
		return false;
	}
}
