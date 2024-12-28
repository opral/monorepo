import {
	addRecommendationToWorkspace,
	isInWorkspaceRecommendation,
} from "./recommendation/recommendation.js";

/**
 * Checks if the Sherlock app should be recommended within the workspace recommendations.
 * @param {Object} args - The arguments object.
 * @param {NodeishFilesystem} args.fs - The filesystem to use for operations.
 * @param {string} [args.workingDirectory] - The working directory path. Defaults to the current directory.
 * @returns {Promise<boolean>} - A promise that resolves to false if the project is adopted, otherwise true.
 */
export async function shouldRecommend(args: {
	fs: typeof import("node:fs/promises");
	workingDirectory?: string;
}): Promise<boolean> {
	return !(await isInWorkspaceRecommendation(args.fs, args.workingDirectory));
}

/**
 * Checks if the Sherlock app is adopted within the workspace recommendations.
 * @param {Object} args - The arguments object.
 * @param {NodeishFilesystem} args.fs - The filesystem to use for operations.
 * @param {string} [args.workingDirectory] - The working directory path. Defaults to the current directory.
 * @returns {Promise<boolean>} - A promise that resolves to false if the project is adopted, otherwise true.
 */
export async function isAdopted(args: {
	fs: typeof import("node:fs/promises");
	workingDirectory?: string;
}): Promise<boolean> {
	return await isInWorkspaceRecommendation(args.fs, args.workingDirectory);
}

/**
 * Adds the Sherlock app to the workspace recommendations.
 * @param {Object} args - The arguments object.
 * @param {NodeishFilesystem} args.fs - The filesystem to use for operations.
 * @param {string} [args.workingDirectory] - The working directory path. Defaults to the current directory.
 * @returns {Promise<void>} - A promise that resolves when the project is successfully added.
 */
export async function add(args: {
	fs: typeof import("node:fs/promises");
	workingDirectory?: string;
}): Promise<void> {
	await addRecommendationToWorkspace(args.fs, args.workingDirectory);
}
