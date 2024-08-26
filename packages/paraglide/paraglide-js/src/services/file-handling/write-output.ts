import path from "node:path"
import crypto from "node:crypto"
import type { NodeishFilesystem } from "./types.js"

let previousOutputHash: string | undefined

export async function writeOutput(
	outputDirectory: string,
	output: Record<string, string>,
	fs: NodeishFilesystem
) {
	// if the output hasn't changed, don't write it
	const currentOutputHash = hashOutput(output, outputDirectory)
	if (currentOutputHash === previousOutputHash) return

	// create the output directory if it doesn't exist
	await fs.stat(outputDirectory).catch(async () => {
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
			await fs.writeFile(fullPath, fileContent)
		})
	)

	//Only update the previousOutputHash if the write was successful
	previousOutputHash = currentOutputHash
}

function hashOutput(output: Record<string, string>, outputDirectory: string): string {
	const hash = crypto.createHash("sha256")
	hash.update(JSON.stringify(output))
	hash.update(outputDirectory)
	return hash.digest("hex")
}
