import type { NodeishFilesystem } from "@lix-js/fs"
import { joinPath } from "./utils/joinPath.js"
import { isExtensionsJson } from "./utils/isExtensionJson.js"
import { parse, type CommentJSONValue, stringify } from "comment-json"
import type { ExtensionsJson } from "./utils/types.js"

export async function addRecommendationToWorkspace(
	fs: NodeishFilesystem,
	workingDirectory?: string
): Promise<void> {
	const vscodeFolderPath = joinPath(workingDirectory ?? "", ".vscode")
	const extensionsJsonPath = joinPath(vscodeFolderPath, "extensions.json")

	if (!(await fs.stat(vscodeFolderPath))) {
		await fs.mkdir(vscodeFolderPath)
	}

	let extensions: ExtensionsJson
	if (await fs.stat(extensionsJsonPath)) {
		try {
			const parsed = parse(await fs.readFile(extensionsJsonPath, { encoding: "utf-8" }))
			if (isExtensionsJson(parsed)) {
				extensions = parsed
			} else {
				extensions = { recommendations: [] }
			}
		} catch (error) {
			extensions = { recommendations: [] }
		}
	} else {
		extensions = { recommendations: [] }
	}

	if (!extensions.recommendations.includes("inlang.vs-code-extension")) {
		extensions.recommendations.push("inlang.vs-code-extension")
		await fs.writeFile(extensionsJsonPath, stringify(extensions, undefined, 2))
	}
}

export async function isInWorkspaceRecommendation(
	fs: NodeishFilesystem,
	workingDirectory?: string
): Promise<boolean> {
	const vscodeFolderPath = joinPath(workingDirectory ?? "", ".vscode")
	const extensionsJsonPath = joinPath(vscodeFolderPath, "extensions.json")

	if (!(await fs.stat(extensionsJsonPath)) || !(await fs.stat(vscodeFolderPath))) {
		return false
	}

	const extensions = parse(
		await fs.readFile(extensionsJsonPath, { encoding: "utf-8" })
	) as CommentJSONValue

	if (!isExtensionsJson(extensions)) {
		return false
	}

	return extensions?.recommendations.includes("inlang.vs-code-extension") || false
}
