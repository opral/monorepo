import { type NodeishFilesystem } from "@lix-js/fs"
import {
	addRecommendationToWorkspace,
	isInWorkspaceRecommendation,
} from "./recommendation/index.js"

export async function isAdopted(
	fs: NodeishFilesystem,
	workingDirectory?: string
): Promise<boolean> {
	return isInWorkspaceRecommendation(fs, workingDirectory)
}

export async function add(fs: NodeishFilesystem, workingDirectory?: string): Promise<void> {
	await addRecommendationToWorkspace(fs, workingDirectory)
}
