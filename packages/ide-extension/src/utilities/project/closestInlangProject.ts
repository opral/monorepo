import { findInlangProjectRecursively } from "./findInlangProjectRecusively.js"
import type { NodeishFilesystem } from "@lix-js/fs"

export async function closestInlangProject(args: {
	workingDirectory: string
	nodeishFs: NodeishFilesystem
}): Promise<string | undefined> {
	if (args.workingDirectory === "") {
		return undefined // No working directory specified
	}

	const inlangProjects = await findInlangProjectRecursively({
		rootPath: args.workingDirectory,
		nodeishFs: args.nodeishFs, // Replace with your NodeishFilesystem implementation
	})

	if (inlangProjects.length === 0) {
		return undefined // No inlang projects found
	}

	// Sort the inlang projects by their path length (shorter paths first)
	inlangProjects.sort((a, b) => a.length - b.length)

	// Return the closest project (the first one in the sorted array)
	return inlangProjects[0]
}
