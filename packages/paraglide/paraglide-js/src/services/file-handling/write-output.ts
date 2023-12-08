import type nodeFsPromises from "node:fs/promises"
import path from "node:path"

export async function writeOutput(
	outputDirectory: string,
	output: Record<string, string>,
	fs: typeof nodeFsPromises
) {
	//Bail if the output directory already contains identical files
	const existing = await readCurrentOutputDirectory(outputDirectory, fs)
	if (recordsAreEqual(existing, output)) return

	// create the output directory if it doesn't exist
	await fs.access(outputDirectory).catch(async () => {
		await fs.mkdir(outputDirectory, { recursive: true })
	})

	// clear the output directory
	const files = await fs.readdir(outputDirectory)
	await Promise.allSettled(
		files.map(async (file) => {
			await fs.unlink(outputDirectory + "/" + file)
		})
	)

	//Create missing directories inside the output directory
	await Promise.allSettled(
		Object.keys(output).map(async (filePath) => {
			const fullPath = path.resolve(outputDirectory, filePath)
			const directory = path.dirname(fullPath)
			await fs.mkdir(directory, { recursive: true })
		})
	)

	//Write files
	await Promise.allSettled(
		Object.entries(output).map(async ([filePath, fileContent]) => {
			const fullPath = path.resolve(outputDirectory, filePath)

			await fs.writeFile(fullPath, fileContent, {
				encoding: "utf-8",
			})
		})
	)
}

/**
 * Performs a shallow comparison of two records by comparing their top level keys and values
 */
function recordsAreEqual(a: Record<string, string>, b: Record<string, string>): boolean {
	const aKeys = Object.keys(a)
	const bKeys = Object.keys(b)

	if (aKeys.length !== bKeys.length) {
		return false
	}

	for (const key of aKeys) {
		if (a[key] !== b[key]) {
			return false
		}
	}

	return true
}

/**
 * Tries to recursively read the current output directory and returns a map of all files and their content
 * If the output directory does not exist, it returns an empty map
 *
 *
 * @example
 * ```ts
 * const output = await readCurrentOutputDirectory(outputDirectory, fs)
 *
 * // output = {
 * //   "runtime.js": "...",
 * //   "messages.js": "...",
 * //   "messages/de.js": "...",
 * //   "messages/en.js": "...",
 * ```
 *
 */
async function readCurrentOutputDirectory(
	outputDirectory: string,
	fs: typeof nodeFsPromises
): Promise<Record<string, string>> {
	try {
		const files = await fs.readdir(outputDirectory, { recursive: true })
		const output: Record<string, string> = {}

		await Promise.allSettled(
			files.map(async (file) => {
				const filePath = path.resolve(outputDirectory, file)
				const fileContent = await fs.readFile(filePath, {
					encoding: "utf-8",
				})
				output[file] = fileContent
			})
		)

		return output
	} catch (e) {
		return {}
	}
}
