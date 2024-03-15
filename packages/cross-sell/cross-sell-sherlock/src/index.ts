import type { NodeishFilesystem } from "@lix-js/fs"
import {
	addRecommendationToWorkspace,
	isInWorkspaceRecommendation,
} from "./recommendation/recommendation.js"

/**
 * Checks if the Sherlock app is adopted within the workspace recommendations.
 * @param {Object} args - The arguments object.
 * @param {NodeishFilesystem} args.fs - The filesystem to use for operations.
 * @param {string} [args.workingDirectory] - The working directory path. Defaults to the current directory.
 * @returns {Promise<boolean>} - A promise that resolves to true if the project is adopted, otherwise false.
 */
export async function isAdopted(args: {
	fs: NodeishFilesystem
	workingDirectory?: string
}): Promise<boolean> {
	return isInWorkspaceRecommendation(args.fs, args.workingDirectory)
}

/**
 * Adds the Sherlock app to the workspace recommendations.
 * @param {Object} args - The arguments object.
 * @param {NodeishFilesystem} args.fs - The filesystem to use for operations.
 * @param {string} [args.workingDirectory] - The working directory path. Defaults to the current directory.
 * @returns {Promise<void>} - A promise that resolves when the project is successfully added.
 */
export async function add(args: {
	fs: NodeishFilesystem
	workingDirectory?: string
}): Promise<void> {
	await addRecommendationToWorkspace(args.fs, args.workingDirectory)
}
