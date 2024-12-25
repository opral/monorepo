/**
 * Returns true if the path exists (file or directory), false otherwise.
 *
 * @param nodeishFs
 * @returns
 */
export async function pathExists(
	filePath: string,
	fs: typeof import("node:fs/promises")
) {
	try {
		await fs.stat(filePath);
		return true;
	} catch (error) {
		//@ts-expect-error - error is Error
		if (error.code === "ENOENT") {
			return false;
		} else {
			throw new Error(`Failed to check if path exists: ${error}`, {
				cause: error,
			});
		}
	}
}
