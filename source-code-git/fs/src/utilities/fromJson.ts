import type { NodeishFilesystem } from "../interface.js"
import { assertIsAbsolutePath } from "./assertIsAbsolutePath.js"
import { decode as decodeBase64 } from "js-base64"

/**
 * "Imports" files from a JSON into the filesystem.
 */
export async function fromJson(args: {
	fs: NodeishFilesystem
	json: Record<string, string>
	resolveFrom: string
}): Promise<void> {
	const { fs, json, resolveFrom } = args

	assertIsAbsolutePath(resolveFrom)

	for (const [filePath, contents] of Object.entries(json)) {
		const path = `${resolveFrom}/${filePath}`
		await fs.mkdir(path, { recursive: true })

		await fs.writeFile(path, decodeBase64(contents))
	}
}
