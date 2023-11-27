import type nodeFsPromises from "node:fs/promises"
import path from "node:path"

export async function writeOutput(
	outputDirectory: string,
	output: Record<string, string>,
	fs: typeof nodeFsPromises
) {
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
